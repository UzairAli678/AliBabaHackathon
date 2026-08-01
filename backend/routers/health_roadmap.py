from fastapi import APIRouter

router = APIRouter(prefix="/health-roadmap", tags=["health-roadmap"])


@router.get("")
def get_health_roadmap() -> dict:
    return {
        "milestones": [
            {"week": 1, "goal": "Initial diagnostics and symptom tracking"},
            {"week": 2, "goal": "Treatment start and follow-up consultation"},
            {"week": 4, "goal": "Progress review and roadmap adjustment"},
        ]
    }
