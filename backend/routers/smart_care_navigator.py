from fastapi import APIRouter

router = APIRouter(prefix="/smart-care-navigator", tags=["smart-care-navigator"])


@router.get("")
def get_smart_care_navigator() -> dict:
    return {
        "suggested_specialty": "General Medicine",
        "nearby_hospitals": [
            {"name": "City Care Hospital", "distance_km": 2.1},
            {"name": "Sunrise Clinic", "distance_km": 4.7},
        ],
    }
