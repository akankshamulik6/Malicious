import pytest
from httpx import AsyncClient
from unittest.mock import patch
from app.schemas.prediction import PredictionResponse, DiseaseStatus, ExplainabilityResult


@pytest.mark.asyncio
async def test_history_and_dashboard_statistics(client: AsyncClient, sample_image_bytes: bytes):
    reg = await client.post(
        "/api/v1/auth/register",
        json={"name": "History Farmer", "email": "history@farm.org", "password": "password123"},
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Perform healthy scan
    pred_healthy = PredictionResponse(
        scan_id="s1",
        crop="Tomato",
        disease="Healthy",
        status=DiseaseStatus.HEALTHY,
        confidence=0.99,
        model_name="model",
        model_version="1.0",
        processing_time_ms=100,
        explainability=ExplainabilityResult(method="grad_cam", available=True),
    )

    # Perform diseased scan
    pred_diseased = PredictionResponse(
        scan_id="s2",
        crop="Tomato",
        disease="Tomato Early Blight",
        status=DiseaseStatus.DISEASED,
        confidence=0.91,
        model_name="model",
        model_version="1.0",
        processing_time_ms=100,
        explainability=ExplainabilityResult(method="grad_cam", available=True),
    )

    with patch("app.clients.member1_ai_client.Member1AIClient.predict", side_effect=[pred_healthy, pred_diseased]), patch(
        "app.clients.member2_advisory_client.Member2AdvisoryClient.get_advisory", return_value=None
    ):
        files = {"image": ("crop.jpg", sample_image_bytes, "image/jpeg")}
        await client.post("/api/v1/scans", headers=headers, files=files)
        await client.post("/api/v1/scans", headers=headers, files=files)

    # 1. Fetch history (/api/v1/scans)
    history_res = await client.get("/api/v1/scans", headers=headers)
    assert history_res.status_code == 200
    scans_list = history_res.json()
    assert len(scans_list) == 2

    # 2. Fetch Dashboard Summary (/api/v1/dashboard/summary)
    dash_res = await client.get("/api/v1/dashboard/summary", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()

    assert dash_data["total_scans"] == 2
    assert dash_data["healthy_scans"] == 1
    assert dash_data["diseased_scans"] == 1
    assert len(dash_data["recent_scans"]) == 2
