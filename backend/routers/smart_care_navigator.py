# Illustrative sample data: real Pakistani institution names are used for demo
# realism only. Fees, ratings, waiting times, and doctor details are fabricated
# and are NOT live/verified data. See backend/data/hospitals_pakistan.json.
import json
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(prefix="/smart-care-navigator", tags=["smart-care-navigator"])

_DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "hospitals_pakistan.json"


def _load_hospitals() -> list[dict]:
    with open(_DATA_PATH, encoding="utf-8") as fh:
        return json.load(fh)["hospitals"]


def _flatten_doctors(hospitals: list[dict]) -> list[dict]:
    doctors: list[dict] = []
    for hospital in hospitals:
        for doc in hospital.get("doctors", []):
            doctors.append(
                {
                    "id": doc["id"],
                    "name": doc["name"],
                    "specialization": doc["specialization"],
                    "hospital_name": hospital["name"],
                    "consultation_fee": doc["fee"],
                    "available_days": doc["available_days"],
                    "time_slots": doc["time_slots"],
                    "qualifications": doc.get("qualifications", ""),
                    "years_experience": doc.get("years_experience", 0),
                    "rating": doc.get("rating", 0),
                    "languages_spoken": doc.get("languages_spoken", []),
                }
            )
    return doctors


HOSPITALS = _load_hospitals()
DOCTORS = _flatten_doctors(HOSPITALS)

# Backward-compatible aliases used by appointments.py
MOCK_HOSPITALS = HOSPITALS
MOCK_DOCTORS = DOCTORS


def _hospital_summary(h: dict) -> dict:
    return {
        "name": h["name"],
        "city": h["city"],
        "area": h["area"],
        "distance_km": h["distance_km"],
        "rating": h["rating"],
        "consultation_fee": h["consultation_fee"],
        "insurance_accepted": h["insurance_accepted"],
        "waiting_time_minutes": h["waiting_time_minutes"],
        "has_emergency_services": h["has_emergency_services"],
        "specialists_available": h["specialists_available"],
    }


@router.get("")
def get_smart_care_navigator() -> dict:
    return {
        "suggested_specialty": "General Medicine",
        "nearby_hospitals": [_hospital_summary(h) for h in HOSPITALS],
        "doctors": DOCTORS,
    }
