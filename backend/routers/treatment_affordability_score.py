from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/treatment-affordability-score", tags=["treatment-affordability-score"])


class TreatmentAffordabilityRequest(BaseModel):
    treatment_type: str = Field(..., min_length=1)
    hospital: str = Field(..., min_length=1)
    estimated_cost: float = Field(..., ge=0)
    insurance_coverage: float = Field(..., ge=0)
    monthly_income: float = Field(..., ge=0)
    monthly_budget: float = Field(..., ge=0)
    existing_debt: float = Field(..., ge=0)


class TreatmentAffordabilityResult(BaseModel):
    id: str
    treatment_type: str
    hospital: str
    affordability_score: int
    summary: str
    cost_breakdown: dict[str, float]
    recommendations: list[dict[str, str]]
    alternatives: list[str]
    financial_insights: list[str]


_storage: list[TreatmentAffordabilityResult] = []


def _build_analysis(payload: TreatmentAffordabilityRequest) -> TreatmentAffordabilityResult:
    out_of_pocket = max(payload.estimated_cost - payload.insurance_coverage, 0)
    monthly_burden = round(max(out_of_pocket / 6, 0), 2)
    budget_gap = round(max(monthly_burden - payload.monthly_budget, 0), 2)
    debt_pressure = round(max(payload.existing_debt / max(payload.monthly_income, 1), 0), 2)

    score = 100
    score -= min(out_of_pocket / 1000, 35)
    score -= min(payload.monthly_budget / 1000, 10)
    score -= min(monthly_burden / 100, 15)
    score -= min(debt_pressure * 8, 20)
    score = max(0, min(100, int(round(score))))

    if score >= 80:
        summary = "This plan looks financially manageable with a modest monthly burden and room in your care budget."
    elif score >= 60:
        summary = "The estimate is manageable, but a payment plan or cost negotiation would help reduce pressure."
    else:
        summary = "The estimate is likely to create a meaningful monthly burden, so a lower-cost alternative or funding support is worth exploring."

    recommendations: list[dict[str, str]] = []
    if out_of_pocket > 0:
        recommendations.append({
            "title": "Request an itemized estimate",
            "detail": "Ask the hospital for a line-by-line estimate to identify charges that could be reduced or scheduled."
        })
    if monthly_burden > payload.monthly_budget:
        recommendations.append({
            "title": "Set up a payment plan",
            "detail": "Many clinics offer installment options that spread the balance over several months."
        })
    if payload.existing_debt > 0:
        recommendations.append({
            "title": "Review debt impact",
            "detail": "Your current debt load increases the burden, so consider a financing conversation before committing."
        })
    if not recommendations:
        recommendations.append({
            "title": "Keep monitoring costs",
            "detail": "Your estimate is already within budget, so continue reviewing provider options as the plan evolves."
        })

    alternatives = []
    if "scan" in payload.treatment_type.lower() or "imaging" in payload.treatment_type.lower():
        alternatives.append("Compare outpatient imaging centers for lower facility fees.")
    if payload.estimated_cost > 10000:
        alternatives.append("Ask whether a lower-cost hospital network or satellite clinic is available.")
    if not alternatives:
        alternatives.append("Compare the same treatment across nearby providers before confirming a schedule.")

    financial_insights = []
    if out_of_pocket > 0:
        financial_insights.append(f"Estimated out-of-pocket cost is {out_of_pocket:.0f} after insurance coverage.")
    if budget_gap > 0:
        financial_insights.append(f"Your monthly budget gap is approximately {budget_gap:.0f}, which may warrant a payment plan.")
    else:
        financial_insights.append("The treatment fits within your monthly budget target on a simple payment estimate.")
    if payload.monthly_income > 0:
        financial_insights.append(f"The monthly burden is about {monthly_burden / max(payload.monthly_income, 1) * 100:.0f}% of your monthly income.")

    return TreatmentAffordabilityResult(
        id=f"affordability-{len(_storage) + 1}",
        treatment_type=payload.treatment_type,
        hospital=payload.hospital,
        affordability_score=score,
        summary=summary,
        cost_breakdown={
            "out_of_pocket_cost": round(out_of_pocket, 2),
            "monthly_burden": round(monthly_burden, 2),
            "budget_gap": round(budget_gap, 2),
        },
        recommendations=recommendations,
        alternatives=alternatives,
        financial_insights=financial_insights,
    )


@router.get("", response_model=list[TreatmentAffordabilityResult])
def get_treatment_affordability_score() -> list[TreatmentAffordabilityResult]:
    return _storage


@router.post("", response_model=TreatmentAffordabilityResult)
def create_treatment_affordability_score(payload: TreatmentAffordabilityRequest) -> TreatmentAffordabilityResult:
    result = _build_analysis(payload)
    _storage.insert(0, result)
    return result
