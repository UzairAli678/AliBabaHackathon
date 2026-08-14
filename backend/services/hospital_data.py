"""Shared hospital knowledge-base access.

Illustrative sample data uses real institution names for demo realism. Doctor
profiles, fees, ratings, availability, distance, and waiting times are not
live or verified data.
"""

import json
from functools import lru_cache
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "hospitals_pakistan.json"


@lru_cache(maxsize=1)
def load_hospitals() -> list[dict]:
    with DATA_PATH.open(encoding="utf-8") as handle:
        payload = json.load(handle)
    hospitals = payload["hospitals"] if isinstance(payload, dict) else payload
    for hospital in hospitals:
        for doctor in hospital.get("doctors", []):
            # Normalize legacy field names at the single data boundary.
            doctor["qualification"] = doctor.get("qualification", doctor.get("qualifications", ""))
            doctor["consultation_fee"] = doctor.get("consultation_fee", doctor.get("fee", hospital["consultation_fee"]))
    return hospitals


def flatten_doctors(hospitals: list[dict] | None = None) -> list[dict]:
    doctors = []
    for hospital in hospitals or load_hospitals():
        for doctor in hospital.get("doctors", []):
            doctors.append({**doctor, "hospital_id": hospital["id"], "hospital_name": hospital["name"]})
    return doctors


def find_hospital(hospital_id: str) -> dict | None:
    return next((hospital for hospital in load_hospitals() if hospital["id"] == hospital_id), None)


def find_doctor(hospital_id: str, doctor_id: str) -> tuple[dict, dict] | None:
    hospital = find_hospital(hospital_id)
    if not hospital:
        return None
    doctor = next((doctor for doctor in hospital.get("doctors", []) if doctor["id"] == doctor_id), None)
    return (hospital, doctor) if doctor else None
