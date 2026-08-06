from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_book_and_fetch_appointments() -> None:
    booking_response = client.post(
        "/appointments",
        json={
            "doctor_id": "dr-khan",
            "doctor_name": "Dr. Amina Khan",
            "specialty": "Cardiology",
            "appointment_date": "2026-08-20",
            "appointment_time": "09:00",
            "mode": "in-person",
            "notes": "Follow-up visit",
            "user_email": "patient@example.com",
        },
    )

    assert booking_response.status_code == 200
    body = booking_response.json()
    assert body["status"] == "scheduled"

    list_response = client.get("/appointments")
    assert list_response.status_code == 200
    records = list_response.json()
    assert len(records) >= 1


def test_conflicting_appointment_is_rejected() -> None:
    response = client.post(
        "/appointments",
        json={
            "doctor_id": "dr-khan",
            "doctor_name": "Dr. Amina Khan",
            "specialty": "Cardiology",
            "appointment_date": "2026-08-20",
            "appointment_time": "09:00",
            "mode": "in-person",
            "notes": "Duplicate",
            "user_email": "patient@example.com",
        },
    )

    assert response.status_code == 409
