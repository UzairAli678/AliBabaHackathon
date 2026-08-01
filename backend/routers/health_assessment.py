from fastapi import APIRouter

router = APIRouter(prefix="/health-assessment", tags=["health-assessment"])


@router.get("")
def get_health_assessment() -> dict:
    return {
        "risk_level": "moderate",
        "likely_conditions": ["seasonal flu", "allergic rhinitis"],
        "recommended_action": "Consult a general physician within 24 hours.",
    }
