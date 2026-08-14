# Illustrative sample data: real Pakistani institution names are used for demo
# realism only. Fees, ratings, waiting times, and doctor details are fabricated
# and are NOT live/verified data. See backend/data/hospitals_pakistan.json.
import json
import os

from fastapi import APIRouter
from google import genai
from google.genai import types
from pydantic import BaseModel
from services.hospital_data import flatten_doctors, load_hospitals
from routers.medical_cost_intelligence import _estimate_range

router = APIRouter(prefix="/smart-care-navigator", tags=["smart-care-navigator"])

HOSPITALS = load_hospitals()
DOCTORS = flatten_doctors(HOSPITALS)


class PersonalizedNavigatorRequest(BaseModel):
    disease: str
    specialist: str
    risk_level: str = "low"


def _normalize_specialty(value: str) -> str:
    value = " ".join(value.lower().replace("&", "and").replace(" specialist", "").split())
    aliases = {
        "dermatologist": "dermatology", "cardiologist": "cardiology", "neurologist": "neurology",
        "pulmonologist": "pulmonology", "gastroenterologist": "gastroenterology", "urologist": "urology",
        "endocrinologist": "endocrinology", "oncologist": "medical oncology", "general physician": "general medicine",
        "internal medicine": "general medicine", "orthopedic": "orthopedic surgery", "orthopedics": "orthopedic surgery",
        "orthopaedic": "orthopedic surgery", "otolaryngology": "ent", "ent specialist": "ent",
        "gynecologist": "gynecology", "gynaecologist": "gynecology", "pediatrician": "pediatrics",
    }
    return aliases.get(value, value)


def _specialty_match_score(doctor_specialty: str, recommended_specialty: str) -> int:
    """Return 2 for an exact specialty match and 1 for a relevant subspecialty."""
    doctor = _normalize_specialty(doctor_specialty)
    recommended = _normalize_specialty(recommended_specialty)
    if doctor == recommended:
        return 2
    doctor_terms = set(doctor.split())
    recommended_terms = set(recommended.split())
    return 1 if doctor_terms & recommended_terms else 0


def _rank_doctors(doctors: list[dict], specialty: str) -> list[dict]:
    ranked = []
    for doctor in doctors:
        score = _specialty_match_score(doctor["specialization"], specialty)
        ranked.append({**doctor, "is_recommended": score > 0, "specialty_match_score": score})
    return sorted(ranked, key=lambda item: (-item["specialty_match_score"], -item["rating"], -item["years_experience"]))


def _fallback_guidance(disease: str) -> dict:
    return {
        "what_to_expect": [
            f"The clinician will review your symptoms and medical history related to {disease}.",
            "A focused examination and relevant tests may be recommended before treatment.",
            "You should receive a clear care plan, warning signs to watch for, and follow-up guidance.",
        ],
        "questions_to_ask": [
            "What tests are needed to confirm this condition?",
            "What treatment options are appropriate for me?",
            "Which warning signs mean I should seek urgent help?",
            "When should I schedule a follow-up visit?",
        ],
    }


def _generate_guidance(disease: str) -> dict:
    fallback = _fallback_guidance(disease)
    try:
        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not api_key:
            return fallback
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=f"For a patient preparing for a visit about {disease}, return JSON only with what_to_expect (3 short plain-language strings) and questions_to_ask (4 useful strings). Do not diagnose or promise treatment.",
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        data = json.loads(response.text or "{}")
        if len(data.get("what_to_expect", [])) < 2 or len(data.get("questions_to_ask", [])) < 3:
            return fallback
        return data
    except Exception:
        return fallback


def _hospital_summary(h: dict) -> dict:
    return {
        "id": h["id"],
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


@router.post("/personalized")
def get_personalized_navigator(payload: PersonalizedNavigatorRequest) -> dict:
    specialty = _normalize_specialty(payload.specialist)
    ranked_hospitals = sorted(HOSPITALS, key=lambda hospital: (
        -max((_specialty_match_score(doctor["specialization"], specialty) for doctor in hospital.get("doctors", [])), default=0),
        -sum(_specialty_match_score(doctor["specialization"], specialty) > 0 for doctor in hospital.get("doctors", [])),
        -hospital["rating"], hospital["waiting_time_minutes"], hospital["distance_km"],
    ))
    hospital = ranked_hospitals[0]
    hospital_doctors = _rank_doctors(flatten_doctors([hospital]), specialty)
    doctor = hospital_doctors[0]
    all_doctors = _rank_doctors(DOCTORS, specialty)
    cost = _estimate_range(payload.disease, "Consultation and labs", hospital["name"])
    return {
        "featured_hospital": _hospital_summary(hospital),
        "featured_doctor": doctor,
        "nearby_hospitals": [_hospital_summary(item) for item in ranked_hospitals],
        "doctors": all_doctors,
        "suggested_specialty": payload.specialist,
        "cost_preview": cost["cost_breakdown"]["total_range"],
        **_generate_guidance(payload.disease),
    }
