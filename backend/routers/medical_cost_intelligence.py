from __future__ import annotations

import os
from typing import Any

from fastapi import APIRouter
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from services.hospital_data import load_hospitals

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


_GENERAL_CONSULTATION_RANGES = {
    'General Physician': (1500, 3000),
    'default': (2500, 5000),
}

# Illustrative PKR ranges grounded in public Pakistani hospital package prices.
# They are planning estimates, not live quotes or bills.
_TREATMENT_COST_BANDS: dict[str, dict[str, tuple[float, float]]] = {
    'consultation only': {'labs': (0, 0), 'medication': (0, 0), 'procedure': (0, 0)},
    'consultation and labs': {'labs': (2500, 12000), 'medication': (0, 0), 'procedure': (0, 0)},
    'consultation and medication': {'labs': (0, 0), 'medication': (2000, 12000), 'procedure': (0, 0)},
    'minor procedure': {'labs': (1500, 8000), 'medication': (1500, 8000), 'procedure': (20000, 80000)},
    'major procedure/surgery': {'labs': (8000, 35000), 'medication': (10000, 60000), 'procedure': (120000, 600000)},
    'diagnostic imaging (x-ray/mri/ct)': {'labs': (0, 5000), 'medication': (0, 0), 'procedure': (5000, 45000)},
    'physical therapy': {'labs': (0, 0), 'medication': (1000, 5000), 'procedure': (8000, 35000)},
    'emergency treatment': {'labs': (5000, 25000), 'medication': (5000, 30000), 'procedure': (15000, 100000)},
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


def _find_hospital(selection: str | None) -> dict[str, Any] | None:
    if not selection:
        return None
    normalized = selection.strip().lower()
    return next(
        (hospital for hospital in load_hospitals() if hospital['id'].lower() == normalized or hospital['name'].lower() == normalized),
        None,
    )


def _normalized_specialty(value: str) -> str:
    aliases = {
        'general physician': 'general medicine', 'internal medicine': 'general medicine',
        'cardiologist': 'cardiology', 'neurologist': 'neurology', 'dermatologist': 'dermatology',
        'pulmonologist': 'pulmonology', 'gastroenterologist': 'gastroenterology',
        'orthopedic specialist': 'orthopedic surgery', 'orthopedics': 'orthopedic surgery',
        'endocrinologist': 'endocrinology', 'urologist': 'urology', 'psychiatrist': 'psychiatry',
    }
    normalized = value.strip().lower()
    return aliases.get(normalized, normalized)


def _matched_doctor(hospital: dict[str, Any], specialist: str) -> dict[str, Any] | None:
    target = _normalized_specialty(specialist)
    matches = [
        doctor for doctor in hospital.get('doctors', [])
        if _normalized_specialty(doctor['specialization']) == target
    ]
    return sorted(matches, key=lambda doctor: (-doctor['rating'], -doctor['years_experience']))[0] if matches else None


def _provider_cost_factor(hospital: dict[str, Any] | None) -> float:
    if not hospital:
        return 1.0
    return max(0.65, min(float(hospital['consultation_fee']) / 2500, 1.45))


def _scale_range(cost_range: tuple[float, float], factor: float) -> tuple[int, int]:
    return tuple(int(round(value * factor / 100) * 100) for value in cost_range)


def _estimate_range(predicted_disease: str, treatment_type: str, selected_hospital: str | None = None) -> dict[str, Any]:
    specialist = _specialist_for_disease(predicted_disease)
    treatment_key = treatment_type.strip().lower()
    cost_band = _TREATMENT_COST_BANDS.get(treatment_key, _TREATMENT_COST_BANDS['consultation only'])
    hospital = _find_hospital(selected_hospital)
    doctor = _matched_doctor(hospital, specialist) if hospital else None
    factor = _provider_cost_factor(hospital)

    if hospital:
        fee = int(doctor['consultation_fee'] if doctor else hospital['consultation_fee'])
        consultation = (fee, fee)
    else:
        consultation = _GENERAL_CONSULTATION_RANGES.get(specialist, _GENERAL_CONSULTATION_RANGES['default'])

    labs = _scale_range(cost_band['labs'], factor)
    medication = _scale_range(cost_band['medication'], factor)
    procedure = _scale_range(cost_band['procedure'], factor)
    total_min = sum(item[0] for item in (consultation, labs, medication, procedure))
    total_max = sum(item[1] for item in (consultation, labs, medication, procedure))

    return {
        'predicted_disease': predicted_disease,
        'treatment_type': treatment_type,
        'selected_hospital': hospital['name'] if hospital else None,
        'specialist': specialist,
        'matched_doctor': doctor['name'] if doctor else None,
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
    matched_doctor: str | None = None
    cost_breakdown: dict[str, Any]


@router.post('/estimate', response_model=CostEstimateResponse)
def estimate_cost(payload: CostEstimateRequest) -> dict[str, Any]:
    return _estimate_range(payload.predicted_disease, payload.treatment_type, payload.selected_hospital)


@router.get('/hospitals')
def get_cost_hospitals() -> dict[str, list[dict[str, Any]]]:
    return {
        'hospitals': [
            {
                'id': hospital['id'],
                'name': hospital['name'],
                'city': hospital['city'],
                'consultation_fee': hospital['consultation_fee'],
            }
            for hospital in load_hospitals()
        ]
    }


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
