from fastapi import APIRouter

router = APIRouter(prefix="/medical-cost-intelligence", tags=["medical-cost-intelligence"])


@router.get("")
def get_medical_cost_intelligence() -> dict:
    return {
        "estimated_cost_range": {"min": 1800, "max": 4200, "currency": "USD"},
        "cost_drivers": ["hospital tier", "diagnostic tests", "medication plan"],
    }
