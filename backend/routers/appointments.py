from fastapi import APIRouter

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.get("")
def get_appointments() -> dict:
    return {
        "upcoming": [
            {"date": "2026-08-03", "provider": "Dr. Khan", "mode": "in-person"},
            {"date": "2026-08-10", "provider": "Dr. Fatima", "mode": "virtual"},
        ]
    }
