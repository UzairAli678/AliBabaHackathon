from __future__ import annotations

import os
from typing import Any

from fastapi import APIRouter
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

router = APIRouter(prefix='/medical-cost-intelligence', tags=['medical-cost-intelligence'])

SYSTEM_INSTRUCTION = (
    'You are the CareLedger AI finance assistant. You explain medical cost and affordability guidance in a calm, clear, '
    'and supportive tone. Be practical and specific. Do not be alarmist. Use the provided numbers and avoid generic advice. '
    'If the situation appears financially stressful, encourage the user to compare providers, ask for itemized billing, '
    'and consider structured care planning in the app.'
)


class CostEstimateRequest(BaseModel):
    predicted_disease: str = Field(..., min_length=1)
    treatment_type: str = Field(..., min_length=1)
    selected_hospital: str | None = None


class AffordabilityAnalysisRequest(BaseModel):
    total_cost_estimate: float = Field(..., ge=0)
    monthly_income: float = Field(..., gt=0)
    existing_savings: float = Field(default=0, ge=0)
    insurance_coverage_percent: float = Field(default=0, ge=0, le=100)
    cost_breakdown: dict[str, Any] | None = None
    treatment_type: str | None = None
    predicted_disease: str | None = None
    selected_hospital: str | None = None


class AffordabilityAnalysisResult(BaseModel):
    affordability_score: int
    score_label: str
    effective_out_of_pocket_cost: float
    ai_summary: str
    ai_suggestions: list[str]


_COST_PRESETS: dict[str, dict[str, tuple[float, float]]] = {
    'consultation': {
        'General Physician': (60, 120),
        'Cardiologist': (120, 220),
        'Dermatologist': (80, 180),
        'Neurologist': (150, 280),
        'Orthopedic Specialist': (130, 260),
        'Gastroenterologist': (110, 210),
        'Pulmonologist': (120, 230),
        'Endocrinologist': (100, 200),
        'Psychiatrist': (90, 180),
        'Urologist': (120, 220),
    },
    'labs': {
        'General Physician': (40, 180),
        'Cardiologist': (80, 260),
        'Dermatologist': (25, 120),
        'Neurologist': (120, 350),
        'Orthopedic Specialist': (90, 240),
        'Gastroenterologist': (70, 220),
        'Pulmonologist': (80, 250),
        'Endocrinologist': (60, 180),
        'Psychiatrist': (20, 100),
        'Urologist': (60, 190),
    },
    'medication': {
        'General Physician': (25, 80),
        'Cardiologist': (50, 180),
        'Dermatologist': (35, 140),
        'Neurologist': (45, 160),
        'Orthopedic Specialist': (40, 150),
        'Gastroenterologist': (35, 130),
        'Pulmonologist': (45, 160),
        'Endocrinologist': (40, 140),
        'Psychiatrist': (50, 180),
        'Urologist': (35, 140),
    },
    'procedure': {
        'General Physician': (100, 350),
        'Cardiologist': (900, 3500),
        'Dermatologist': (250, 1400),
        'Neurologist': (800, 4000),
        'Orthopedic Specialist': (700, 3200),
        'Gastroenterologist': (600, 2800),
        'Pulmonologist': (500, 2600),
        'Endocrinologist': (300, 1200),
        'Psychiatrist': (120, 500),
        'Urologist': (500, 2400),
    },
}

_HOSPITAL_TIER_MULTIPLIERS = {
    'general': 0.92,
    'community': 0.96,
    'specialty': 1.08,
    'academic': 1.18,
    'premium': 1.28,
    'default': 1.0,
}

_TREATMENT_SPECIALIST_HINTS = {
    'surgery': 'procedure',
    'scan': 'procedure',
    'imaging': 'procedure',
    'therapy': 'medication',
    'follow-up': 'consultation',
    'consultation': 'consultation',
}


def _specialist_for_disease(predicted_disease: str) -> str:
    disease = predicted_disease.lower()
    if any(keyword in disease for keyword in ['heart', 'hypertension', 'cardiac']):
        return 'Cardiologist'
    if any(keyword in disease for keyword in ['skin', 'fungal', 'rash', 'psoriasis']):
        return 'Dermatologist'
    if any(keyword in disease for keyword in ['asthma', 'pneumonia', 'tuberculosis', 'respiratory']):
        return 'Pulmonologist'
    if any(keyword in disease for keyword in ['migraine', 'vertigo', 'paralysis', 'brain', 'stroke']):
        return 'Neurologist'
    if any(keyword in disease for keyword in ['bone', 'joint', 'arthritis', 'sprain']):
        return 'Orthopedic Specialist'
    if any(keyword in disease for keyword in ['diabetes', 'thyroid']):
        return 'Endocrinologist'
    if any(keyword in disease for keyword in ['gastro', 'stomach', 'acidity', 'hepatitis']):
        return 'Gastroenterologist'
    if any(keyword in disease for keyword in ['kidney', 'urinary', 'bladder', 'uti']):
        return 'Urologist'
    if any(keyword in disease for keyword in ['mental', 'depress', 'anxiety']):
        return 'Psychiatrist'
    return 'General Physician'


def _normalize_hospital_tier(selected_hospital: str | None) -> float:
    if not selected_hospital:
        return _HOSPITAL_TIER_MULTIPLIERS['default']

    hospital = selected_hospital.lower()
    if 'premium' in hospital or 'private' in hospital:
        return _HOSPITAL_TIER_MULTIPLIERS['premium']
    if 'academic' in hospital or 'teaching' in hospital:
        return _HOSPITAL_TIER_MULTIPLIERS['academic']
    if 'specialty' in hospital or 'center' in hospital:
        return _HOSPITAL_TIER_MULTIPLIERS['specialty']
    if 'community' in hospital or 'local' in hospital:
        return _HOSPITAL_TIER_MULTIPLIERS['community']
    if 'general' in hospital or 'public' in hospital:
        return _HOSPITAL_TIER_MULTIPLIERS['general']
    return _HOSPITAL_TIER_MULTIPLIERS['default']


def _estimate_range(predicted_disease: str, treatment_type: str, selected_hospital: str | None = None) -> dict[str, Any]:
    specialist = _specialist_for_disease(predicted_disease)
    treatment_lower = treatment_type.lower()
    cost_key = 'consultation'
    for keyword, mapped_key in _TREATMENT_SPECIALIST_HINTS.items():
        if keyword in treatment_lower:
            cost_key = mapped_key
            break

    consultation_range = _COST_PRESETS['consultation'].get(specialist, _COST_PRESETS['consultation']['General Physician'])
    labs_range = _COST_PRESETS['labs'].get(specialist, _COST_PRESETS['labs']['General Physician'])
    medication_range = _COST_PRESETS['medication'].get(specialist, _COST_PRESETS['medication']['General Physician'])
    procedure_range = _COST_PRESETS['procedure'].get(specialist, _COST_PRESETS['procedure']['General Physician'])

    if cost_key == 'consultation':
        consultation_range = (consultation_range[0] * 1.0, consultation_range[1] * 1.0)
        labs_range = (labs_range[0] * 0.6, labs_range[1] * 0.8)
        medication_range = (medication_range[0] * 0.7, medication_range[1] * 0.9)
        procedure_range = (0, 0)
    elif cost_key == 'labs':
        consultation_range = (consultation_range[0] * 1.0, consultation_range[1] * 1.1)
        procedure_range = (0, 0)
    elif cost_key == 'medication':
        consultation_range = (consultation_range[0] * 1.0, consultation_range[1] * 1.0)
        procedure_range = (0, 0)
    elif cost_key == 'procedure':
        consultation_range = (consultation_range[0] * 1.1, consultation_range[1] * 1.2)

    tier_multiplier = _normalize_hospital_tier(selected_hospital)

    consultation = (round(consultation_range[0] * tier_multiplier, 2), round(consultation_range[1] * tier_multiplier, 2))
    labs = (round(labs_range[0] * tier_multiplier, 2), round(labs_range[1] * tier_multiplier, 2))
    medication = (round(medication_range[0] * tier_multiplier, 2), round(medication_range[1] * tier_multiplier, 2))
    procedure = (round(procedure_range[0] * tier_multiplier, 2), round(procedure_range[1] * tier_multiplier, 2))

    total_min = round(consultation[0] + labs[0] + medication[0] + procedure[0], 2)
    total_max = round(consultation[1] + labs[1] + medication[1] + procedure[1], 2)

    return {
        'predicted_disease': predicted_disease,
        'treatment_type': treatment_type,
        'selected_hospital': selected_hospital,
        'specialist': specialist,
        'cost_breakdown': {
            'consultation': {'min': consultation[0], 'max': consultation[1]},
            'labs': {'min': labs[0], 'max': labs[1]},
            'medication': {'min': medication[0], 'max': medication[1]},
            'procedure': {'min': procedure[0], 'max': procedure[1]},
            'total_range': {'min': total_min, 'max': total_max},
        },
    }


class CostEstimateResponse(BaseModel):
    predicted_disease: str
    treatment_type: str
    selected_hospital: str | None = None
    specialist: str
    cost_breakdown: dict[str, Any]


@router.post('/estimate', response_model=CostEstimateResponse)
def estimate_cost(payload: CostEstimateRequest) -> dict[str, Any]:
    return _estimate_range(payload.predicted_disease, payload.treatment_type, payload.selected_hospital)


def _build_fallback_suggestions(score: int, effective_out_of_pocket_cost: float, monthly_income: float, existing_savings: float) -> list[str]:
    suggestions = []
    monthly_budget_share = effective_out_of_pocket_cost / max(monthly_income, 1) * 100

    suggestions.append(f'Your out-of-pocket estimate is about {effective_out_of_pocket_cost:.0f}, so ask for a line-by-line bill before confirming care.')
    if existing_savings > 0:
        suggestions.append(f'With {existing_savings:.0f} in savings, you can cover part of the estimate without using the full monthly budget.')
    if monthly_budget_share > 20:
        suggestions.append(f'The treatment may use roughly {monthly_budget_share:.0f}% of monthly income, so compare provider quotes and consider a payment plan.')
    else:
        suggestions.append(f'The treatment uses about {monthly_budget_share:.0f}% of monthly income, which is more manageable but still worth planning for.')

    if score < 60:
        suggestions.append('Consider Smart Care Navigator to compare lower-cost care pathways and nearby providers.')
    else:
        suggestions.append('Keep the treatment plan but continue checking provider pricing before you book.')

    return suggestions[:3]


@router.post('/affordability-analysis')
def affordability_analysis(payload: AffordabilityAnalysisRequest) -> dict[str, Any]:
    insurance_value = max(min(payload.insurance_coverage_percent, 100), 0) / 100
    insured_cost = payload.total_cost_estimate * (1 - insurance_value)
    effective_out_of_pocket_cost = max(insured_cost - payload.existing_savings, 0)

    income_ratio = effective_out_of_pocket_cost / max(payload.monthly_income, 1)
    savings_ratio = payload.existing_savings / max(payload.total_cost_estimate, 1)

    affordability_score = 100
    affordability_score -= min(income_ratio * 70, 60)
    affordability_score -= min((1 - min(savings_ratio, 1)) * 20, 20)
    affordability_score -= min((payload.insurance_coverage_percent / 100) * 10, 10)
    affordability_score = max(0, min(100, int(round(affordability_score))))

    if affordability_score >= 80:
        score_label = 'Easily affordable'
    elif affordability_score >= 55:
        score_label = 'Manageable'
    else:
        score_label = 'Significant strain'

    cost_breakdown = payload.cost_breakdown or {}
    model_input = (
        f'Cost breakdown: {cost_breakdown}. Total cost estimate: {payload.total_cost_estimate}. '\
        f'Monthly income: {payload.monthly_income}. Existing savings: {payload.existing_savings}. '\
        f'Insurance coverage percent: {payload.insurance_coverage_percent}. Effective out-of-pocket cost: {effective_out_of_pocket_cost}. '\
        f'Calculated affordability score: {affordability_score}/100 labeled {score_label}. '
        f'Treatment type: {payload.treatment_type or "not specified"}. Predicted disease: {payload.predicted_disease or "not specified"}. '
        'Return a short empathetic 2-3 sentence summary and exactly 3 personalized suggestions that mention the actual numbers.'
    )

    try:
        api_key = os.getenv('GEMINI_API_KEY', '').strip()
        if not api_key:
            raise RuntimeError('GEMINI_API_KEY is not configured')

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=os.getenv('GEMINI_MODEL', 'gemini-2.5-flash'),
            contents=[
                types.Content(
                    role='user',
                    parts=[types.Part.from_text(text=model_input)],
                )
            ],
            config=types.GenerateContentConfig(system_instruction=SYSTEM_INSTRUCTION),
        )
        ai_text = getattr(response, 'text', '') or ''
        if not ai_text.strip():
            raise RuntimeError('Gemini returned an empty response')

        lines = [line.strip('-• ').strip() for line in ai_text.splitlines() if line.strip()]
        ai_summary = lines[0]
        ai_suggestions = [line for line in lines[1:4]]
        if len(ai_suggestions) < 3:
            ai_suggestions = _build_fallback_suggestions(affordability_score, effective_out_of_pocket_cost, payload.monthly_income, payload.existing_savings)
    except Exception:
        ai_summary = (
            f'Your estimate leaves about {effective_out_of_pocket_cost:.0f} to manage after insurance and savings, '
            f'which makes this {score_label.lower()} right now.'
        )
        ai_suggestions = _build_fallback_suggestions(affordability_score, effective_out_of_pocket_cost, payload.monthly_income, payload.existing_savings)
    # Normalize currency mentions to PKR for consistent frontend display
    def _normalize_currency_text(text: str) -> str:
        if not text:
            return text
        # Replace common USD markers with PKR and keep spacing tidy
        text = text.replace('$', 'PKR ')
        text = text.replace('USD', 'PKR')
        return text

    ai_summary = _normalize_currency_text(ai_summary)
    ai_suggestions = [_normalize_currency_text(s) for s in ai_suggestions]
    return {
        'affordability_score': affordability_score,
        'score_label': score_label,
        'effective_out_of_pocket_cost': round(effective_out_of_pocket_cost, 2),
        'ai_summary': ai_summary,
        'ai_suggestions': ai_suggestions,
    }
