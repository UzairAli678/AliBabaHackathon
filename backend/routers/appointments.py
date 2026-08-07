from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/appointments", tags=["appointments"])


class AppointmentRequest(BaseModel):
    doctor_id: str = Field(..., min_length=1)
    doctor_name: str = Field(..., min_length=1)
    specialty: str = Field(..., min_length=1)
    appointment_date: str = Field(..., min_length=1)
    appointment_time: str = Field(..., min_length=1)
    mode: str = Field(default="in-person")
    notes: str = Field(default="")
    user_email: str = Field(..., min_length=1)


class AppointmentUpdateRequest(BaseModel):
    appointment_date: str | None = None
    appointment_time: str | None = None
    mode: str | None = None
    notes: str | None = None
    status: str | None = None


class AppointmentRecord(BaseModel):
    id: str
    doctor_id: str
    doctor_name: str
    specialty: str
    appointment_date: str
    appointment_time: str
    mode: str
    notes: str
    status: str
    user_email: str


_storage: list[AppointmentRecord] = []


def _is_valid_slot(date_str: str, time_str: str) -> bool:
    try:
        datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid appointment date or time") from exc
    return True


def _conflict_exists(doctor_id: str, date_str: str, time_str: str, exclude_id: str | None = None) -> bool:
    return any(
        item.doctor_id == doctor_id and item.appointment_date == date_str and item.appointment_time == time_str and item.id != (exclude_id or "")
        for item in _storage
    )


@router.get("", response_model=list[AppointmentRecord])
def get_appointments() -> list[AppointmentRecord]:
    return _storage


@router.post("", response_model=AppointmentRecord)
def create_appointment(payload: AppointmentRequest) -> AppointmentRecord:
    _is_valid_slot(payload.appointment_date, payload.appointment_time)

    if _conflict_exists(payload.doctor_id, payload.appointment_date, payload.appointment_time):
        raise HTTPException(status_code=409, detail="The selected time slot is no longer available")

    record = AppointmentRecord(
        id=f"appt-{len(_storage) + 1}",
        doctor_id=payload.doctor_id,
        doctor_name=payload.doctor_name,
        specialty=payload.specialty,
        appointment_date=payload.appointment_date,
        appointment_time=payload.appointment_time,
        mode=payload.mode,
        notes=payload.notes,
        status="scheduled",
        user_email=payload.user_email,
    )
    _storage.append(record)
    return record


@router.patch("/{appointment_id}", response_model=AppointmentRecord)
def update_appointment(appointment_id: str, payload: AppointmentUpdateRequest) -> AppointmentRecord:
    appointment = next((item for item in _storage if item.id == appointment_id), None)
    if appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if payload.appointment_date is not None or payload.appointment_time is not None:
        next_date = payload.appointment_date or appointment.appointment_date
        next_time = payload.appointment_time or appointment.appointment_time
        _is_valid_slot(next_date, next_time)

        if _conflict_exists(appointment.doctor_id, next_date, next_time, appointment.id):
            raise HTTPException(status_code=409, detail="The selected time slot is no longer available")

        appointment.appointment_date = next_date
        appointment.appointment_time = next_time

    if payload.mode is not None:
        appointment.mode = payload.mode
    if payload.notes is not None:
        appointment.notes = payload.notes
    if payload.status is not None:
        appointment.status = payload.status

    return appointment


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_appointment(appointment_id: str) -> None:
    appointment = next((item for item in _storage if item.id == appointment_id), None)
    if appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment.status = "cancelled"
