from fastapi import APIRouter

router = APIRouter(prefix="/smart-care-navigator", tags=["smart-care-navigator"])

MOCK_HOSPITALS = [
    {
        "name": "City Care Hospital",
        "distance_km": 2.1,
        "address": "Main Boulevard, Lahore",
        "rating": 4.8,
        "style": "Specialty",
    },
    {
        "name": "Sunrise Clinic",
        "distance_km": 4.7,
        "address": "DHA Phase 6, Lahore",
        "rating": 4.6,
        "style": "Community",
    },
    {
        "name": "Teal Medical Center",
        "distance_km": 6.2,
        "address": "Gulberg III, Lahore",
        "rating": 4.7,
        "style": "Academic",
    },
]

MOCK_DOCTORS = [
    {
        "id": "dr-amina-khan",
        "name": "Dr. Amina Khan",
        "specialization": "Cardiology",
        "hospital_name": "City Care Hospital",
        "consultation_fee": 3500,
        "available_days": ["Mon", "Wed", "Fri"],
        "time_slots": ["09:00 AM", "10:30 AM", "02:00 PM"],
    },
    {
        "id": "dr-sara-fatima",
        "name": "Dr. Sara Fatima",
        "specialization": "Neurology",
        "hospital_name": "Teal Medical Center",
        "consultation_fee": 4200,
        "available_days": ["Tue", "Thu", "Sat"],
        "time_slots": ["08:30 AM", "11:00 AM", "03:30 PM"],
    },
    {
        "id": "dr-bilal-hassan",
        "name": "Dr. Bilal Hassan",
        "specialization": "Orthopedics",
        "hospital_name": "Sunrise Clinic",
        "consultation_fee": 3000,
        "available_days": ["Mon", "Thu", "Sun"],
        "time_slots": ["09:30 AM", "01:00 PM", "04:00 PM"],
    },
]


@router.get("")
def get_smart_care_navigator() -> dict:
    return {
        "suggested_specialty": "General Medicine",
        "nearby_hospitals": MOCK_HOSPITALS,
        "doctors": MOCK_DOCTORS,
    }
