from fastapi import APIRouter

router = APIRouter(prefix="/treatment-affordability-score", tags=["treatment-affordability-score"])


@router.get("")
def get_treatment_affordability_score() -> dict:
    return {
        "affordability_score": 74,
        "monthly_burden_estimate": 260,
        "recommendation": "Consider installment plan with partnered provider.",
    }
