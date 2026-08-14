from routers.medical_cost_intelligence import _estimate_range, get_cost_hospitals


def test_cost_hospital_catalog_uses_shared_knowledge_base() -> None:
    hospitals = get_cost_hospitals()["hospitals"]
    names = {hospital["name"] for hospital in hospitals}

    assert "Aga Khan University Hospital" in names
    assert "Shaukat Khanum Memorial Cancer Hospital" in names
    assert "City General Hospital" not in names


def test_selected_hospital_uses_matched_doctor_fee_and_realistic_surgery_band() -> None:
    estimate = _estimate_range(
        "Heart disease",
        "Major procedure/surgery",
        "aga-khan-university-hospital-karachi",
    )

    assert estimate["selected_hospital"] == "Aga Khan University Hospital"
    assert estimate["matched_doctor"] == "Dr. Fatima Shahid"
    assert estimate["cost_breakdown"]["consultation"] == {"min": 4000, "max": 4000}
    assert estimate["cost_breakdown"]["total_range"]["min"] >= 150_000
    assert estimate["cost_breakdown"]["total_range"]["max"] >= 500_000


def test_general_consultation_fallback_is_much_lower_than_surgery() -> None:
    consultation = _estimate_range("Heart disease", "Consultation only")
    surgery = _estimate_range("Heart disease", "Major procedure/surgery")

    assert consultation["selected_hospital"] is None
    assert 1500 <= consultation["cost_breakdown"]["total_range"]["min"] <= 5000
    assert surgery["cost_breakdown"]["total_range"]["min"] > consultation["cost_breakdown"]["total_range"]["max"] * 20
