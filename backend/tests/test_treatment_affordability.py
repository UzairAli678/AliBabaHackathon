from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_treatment_affordability_analysis_returns_result() -> None:
    response = client.post(
        "/treatment-affordability-score",
        json={
            "treatment_type": "MRI Scan",
            "hospital": "City General Hospital",
            "estimated_cost": 12000,
            "insurance_coverage": 6000,
            "monthly_income": 4200,
            "monthly_budget": 500,
            "existing_debt": 800,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert 0 <= body["affordability_score"] <= 100
    assert body["cost_breakdown"]["out_of_pocket_cost"] >= 0
    assert len(body["recommendations"]) > 0


def test_treatment_affordability_history_is_available() -> None:
    response = client.get("/treatment-affordability-score")

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
