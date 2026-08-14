from __future__ import annotations

import os
from datetime import date, datetime
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from services.hospital_data import find_doctor, flatten_doctors, load_hospitals
from routers.smart_care_navigator import _rank_doctors

router = APIRouter(prefix="/appointments", tags=["appointments"])

SYSTEM_INSTRUCTION = (
    "You are the CareLedger AI appointments assistant. Write warm, concise booking confirmations that reference the "
    "doctor, hospital, date, and time the user selected. Keep the tone reassuring and practical."
)


class AppointmentBookRequest(BaseModel):
    hospital_id: str = Field(..., min_length=1)
    doctor_id: str = Field(..., min_length=1)
    appointment_date: str = Field(..., min_length=1)
    time_slot: str = Field(..., min_length=1)
    appointment_type: str = Field(..., min_length=1)
    reason_for_visit: str = Field(default="")


class AppointmentRecord(BaseModel):
    appointment_id: str
    hospital_id: str
    doctor_id: str
    hospital_name: str
    doctor_name: str
    specialization: str
    consultation_fee: float
    appointment_date: str
    time_slot: str
    appointment_type: str
    reason_for_visit: str
    status: str
    confirmation_message: str


_session_bookings: list[AppointmentRecord] = []


def _build_fallback_confirmation(payload: AppointmentBookRequest, hospital: dict, doctor: dict) -> str:
    return (
        f"Your appointment with {doctor['name']} at {hospital['name']} has been confirmed for "
        f"{payload.appointment_date} at {payload.time_slot}. Your consultation fee is PKR {doctor['consultation_fee']:,.0f}."
    )


def _generate_confirmation_message(payload: AppointmentBookRequest, hospital: dict, doctor: dict) -> str:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return _build_fallback_confirmation(payload, hospital, doctor)

    try:
        client = genai.Client(api_key=api_key)
        prompt = (
            f"Write a warm, short appointment confirmation message for {doctor['name']} at {hospital['name']}. "
            f"The appointment date is {payload.appointment_date}, the time is {payload.time_slot}, the visit type is {payload.appointment_type}, "
            f"and the fee is PKR {doctor['consultation_fee']:,.0f}. Mention the reason briefly if helpful: {payload.reason_for_visit or 'not provided'}. "
            "Keep it under 3 sentences and mention the actual doctor, hospital, date, and time."
        )
        response = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=[types.Content(role="user", parts=[types.Part.from_text(text=prompt)])],
            config=types.GenerateContentConfig(system_instruction=SYSTEM_INSTRUCTION),
        )
        text = getattr(response, "text", "") or ""
        return text.strip() or _build_fallback_confirmation(payload, hospital, doctor)
    except Exception:
        return _build_fallback_confirmation(payload, hospital, doctor)


def _validate_booking(payload: AppointmentBookRequest) -> tuple[dict, dict]:
    selection = find_doctor(payload.hospital_id, payload.doctor_id)
    if not selection:
        raise HTTPException(status_code=400, detail="Unknown hospital or doctor selection")
    hospital, doctor = selection

    try:
        appointment_date = datetime.strptime(payload.appointment_date, "%Y-%m-%d")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid appointment date") from exc

    if appointment_date.date() < date.today():
        raise HTTPException(status_code=400, detail="Appointment date cannot be in the past")

    selected_day = appointment_date.strftime("%a")
    if selected_day not in doctor["available_days"]:
        days = ", ".join(doctor["available_days"])
        raise HTTPException(status_code=400, detail=f"{doctor['name']} isn't available on this day - available days: {days}")

    if payload.time_slot not in doctor["time_slots"]:
        raise HTTPException(status_code=400, detail="Selected time slot is not available for this doctor")

    if payload.appointment_type not in {"In-person", "Video call"}:
        raise HTTPException(status_code=400, detail="Invalid appointment type")
    return hospital, doctor


@router.post("/book", response_model=AppointmentRecord)
def book_appointment(payload: AppointmentBookRequest) -> AppointmentRecord:
    hospital, doctor = _validate_booking(payload)
    has_conflict = any(
        booking.doctor_id == payload.doctor_id
        and booking.appointment_date == payload.appointment_date
        and booking.time_slot == payload.time_slot
        for booking in _session_bookings
    )
    if has_conflict:
        raise HTTPException(
            status_code=400,
            detail="This doctor is already booked for the selected date and time slot",
        )
    confirmation_message = _generate_confirmation_message(payload, hospital, doctor)

    record = AppointmentRecord(
        appointment_id=f"apt-{uuid4().hex[:8]}",
        hospital_id=hospital["id"],
        doctor_id=doctor["id"],
        hospital_name=hospital["name"],
        doctor_name=doctor["name"],
        specialization=doctor["specialization"],
        consultation_fee=doctor["consultation_fee"],
        appointment_date=payload.appointment_date,
        time_slot=payload.time_slot,
        appointment_type=payload.appointment_type,
        reason_for_visit=payload.reason_for_visit,
        status="Confirmed",
        confirmation_message=confirmation_message,
    )
    _session_bookings.append(record)
    return record


@router.get("/my-appointments", response_model=list[AppointmentRecord])
def get_my_appointments() -> list[AppointmentRecord]:
    return _session_bookings


@router.get("/catalog")
def get_appointment_catalog(recommended_specialist: str | None = Query(default=None)) -> dict:
    hospitals = load_hospitals()
    doctors = flatten_doctors(hospitals)
    if recommended_specialist:
        doctors = _rank_doctors(doctors, recommended_specialist)
    else:
        doctors = [{**doctor, "is_recommended": False, "specialty_match_score": 0} for doctor in doctors]
    return {
        "hospitals": hospitals,
        "doctors": doctors,
        "recommended_specialist": recommended_specialist,
    }
