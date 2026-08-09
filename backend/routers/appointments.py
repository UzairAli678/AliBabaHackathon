from __future__ import annotations

import os
from datetime import datetime
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from routers.smart_care_navigator import MOCK_DOCTORS, MOCK_HOSPITALS

router = APIRouter(prefix="/appointments", tags=["appointments"])

SYSTEM_INSTRUCTION = (
    "You are the CareLedger AI appointments assistant. Write warm, concise booking confirmations that reference the "
    "doctor, hospital, date, and time the user selected. Keep the tone reassuring and practical."
)


class AppointmentBookRequest(BaseModel):
    hospital_name: str = Field(..., min_length=1)
    doctor_name: str = Field(..., min_length=1)
    specialization: str = Field(..., min_length=1)
    consultation_fee: float = Field(..., ge=0)
    appointment_date: str = Field(..., min_length=1)
    time_slot: str = Field(..., min_length=1)
    appointment_type: str = Field(..., min_length=1)
    reason_for_visit: str = Field(default="")


class AppointmentRecord(BaseModel):
    appointment_id: str
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


def _find_doctor(doctor_name: str) -> dict[str, Any] | None:
    return next((doctor for doctor in MOCK_DOCTORS if doctor["name"].lower() == doctor_name.lower()), None)


def _find_hospital(hospital_name: str) -> dict[str, Any] | None:
    return next((hospital for hospital in MOCK_HOSPITALS if hospital["name"].lower() == hospital_name.lower()), None)


def _build_fallback_confirmation(payload: AppointmentBookRequest) -> str:
    return (
        f"Your appointment with {payload.doctor_name} at {payload.hospital_name} has been confirmed for "
        f"{payload.appointment_date} at {payload.time_slot}. Your consultation fee is PKR {payload.consultation_fee:,.0f}."
    )


def _generate_confirmation_message(payload: AppointmentBookRequest) -> str:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return _build_fallback_confirmation(payload)

    try:
        client = genai.Client(api_key=api_key)
        prompt = (
            f"Write a warm, short appointment confirmation message for {payload.doctor_name} at {payload.hospital_name}. "
            f"The appointment date is {payload.appointment_date}, the time is {payload.time_slot}, the visit type is {payload.appointment_type}, "
            f"and the fee is PKR {payload.consultation_fee:,.0f}. Mention the reason briefly if helpful: {payload.reason_for_visit or 'not provided'}. "
            "Keep it under 3 sentences and mention the actual doctor, hospital, date, and time."
        )
        response = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=[types.Content(role="user", parts=[types.Part.from_text(text=prompt)])],
            config=types.GenerateContentConfig(system_instruction=SYSTEM_INSTRUCTION),
        )
        text = getattr(response, "text", "") or ""
        return text.strip() or _build_fallback_confirmation(payload)
    except Exception:
        return _build_fallback_confirmation(payload)


def _validate_booking(payload: AppointmentBookRequest) -> None:
    if not _find_hospital(payload.hospital_name):
        raise HTTPException(status_code=400, detail="Unknown hospital name")

    doctor = _find_doctor(payload.doctor_name)
    if not doctor:
        raise HTTPException(status_code=400, detail="Unknown doctor name")

    if doctor["hospital_name"].lower() != payload.hospital_name.lower():
        raise HTTPException(status_code=400, detail="Selected doctor does not practice at the chosen hospital")

    if doctor["specialization"].lower() != payload.specialization.lower():
        raise HTTPException(status_code=400, detail="Specialization does not match the selected doctor")

    if float(doctor["consultation_fee"]) != float(payload.consultation_fee):
        raise HTTPException(status_code=400, detail="Consultation fee does not match the selected doctor")

    try:
        datetime.strptime(payload.appointment_date, "%Y-%m-%d")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid appointment date") from exc

    if payload.time_slot not in doctor["time_slots"]:
        raise HTTPException(status_code=400, detail="Selected time slot is not available for this doctor")

    if payload.appointment_type not in {"In-person", "Video call"}:
        raise HTTPException(status_code=400, detail="Invalid appointment type")


@router.post("/book", response_model=AppointmentRecord)
def book_appointment(payload: AppointmentBookRequest) -> AppointmentRecord:
    _validate_booking(payload)
    confirmation_message = _generate_confirmation_message(payload)

    record = AppointmentRecord(
        appointment_id=f"apt-{uuid4().hex[:8]}",
        hospital_name=payload.hospital_name,
        doctor_name=payload.doctor_name,
        specialization=payload.specialization,
        consultation_fee=payload.consultation_fee,
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
