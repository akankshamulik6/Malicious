import pytest
from httpx import AsyncClient
from unittest.mock import patch
from app.schemas.prediction import PredictionResponse, DiseaseStatus, ExplainabilityResult
from app.schemas.advisory import AgriculturalAdvisory


@pytest.mark.asyncio
async def test_create_scan_success(client: AsyncClient, sample_image_bytes: bytes):
    # 1. Register user & get token
    reg = await client.post(
        "/api/v1/auth/register",
        json={"name": "Farmer Joe", "email": "joe@farm.org", "password": "password123"},
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Mock Member 1 & Member 2 response
    mock_prediction = PredictionResponse(
        scan_id="will_be_overridden",
        crop="Tomato",
        disease="Tomato Early Blight",
        status=DiseaseStatus.DISEASED,
        confidence=0.94,
        model_name="crop_disease_classifier",
        model_version="1.0.0",
        processing_time_ms=800,
        explainability=ExplainabilityResult(method="grad_cam", available=True),
        detections=[],
    )

    mock_advisory = AgriculturalAdvisory(
        scan_id="will_be_overridden",
        crop="Tomato",
        disease="Tomato Early Blight",
        status=DiseaseStatus.DISEASED,
        confidence=0.94,
        description="Fungal spot infection",
        symptoms=["Leaf spots"],
        possible_causes=["Alternaria solani"],
        severity="moderate",
        management_practices=["Fungicide spray"],
        preventive_measures=["Crop rotation"],
        advisory_status="ready",
    )

    with patch("app.clients.member1_ai_client.Member1AIClient.predict", return_value=mock_prediction), patch(
        "app.clients.member2_advisory_client.Member2AdvisoryClient.get_advisory", return_value=mock_advisory
    ):
        files = {"image": ("test_crop.jpg", sample_image_bytes, "image/jpeg")}
        data = {
            "country": "India",
            "state": "Maharashtra",
            "district": "Pune",
            "latitude": "18.5204",
            "longitude": "73.8567",
        }

        response = await client.post("/api/v1/scans", headers=headers, files=files, data=data)
        assert response.status_code == 201
        res_data = response.json()

        assert "prediction" in res_data
        assert "advisory" in res_data
        assert res_data["prediction"]["crop"] == "Tomato"
        assert res_data["prediction"]["status"] == "diseased"
        assert res_data["prediction"]["confidence"] == 0.94
        assert res_data["advisory"]["severity"] == "moderate"

        # Verify scan_id consistency across prediction & advisory
        scan_id = res_data["prediction"]["scan_id"]
        assert res_data["advisory"]["scan_id"] == scan_id

        # Retrieve scan by scan_id
        detail_res = await client.get(f"/api/v1/scans/{scan_id}", headers=headers)
        assert detail_res.status_code == 200
        assert detail_res.json()["prediction"]["scan_id"] == scan_id


@pytest.mark.asyncio
async def test_scan_user_isolation(client: AsyncClient, sample_image_bytes: bytes):
    # User A creates a scan
    reg_a = await client.post(
        "/api/v1/auth/register",
        json={"name": "User A", "email": "usera@farm.org", "password": "password123"},
    )
    token_a = reg_a.json()["access_token"]

    mock_prediction = PredictionResponse(
        scan_id="scan_user_a",
        crop="Wheat",
        disease="Rust",
        status=DiseaseStatus.DISEASED,
        confidence=0.88,
        model_name="crop_disease_classifier",
        model_version="1.0.0",
        processing_time_ms=500,
        explainability=ExplainabilityResult(method="grad_cam", available=False),
        detections=[],
    )

    with patch("app.clients.member1_ai_client.Member1AIClient.predict", return_value=mock_prediction), patch(
        "app.clients.member2_advisory_client.Member2AdvisoryClient.get_advisory", return_value=None
    ):
        files = {"image": ("wheat.jpg", sample_image_bytes, "image/jpeg")}
        res_a = await client.post(
            "/api/v1/scans", headers={"Authorization": f"Bearer {token_a}"}, files=files
        )
        scan_id_a = res_a.json()["prediction"]["scan_id"]

    # User B tries to access User A's scan
    reg_b = await client.post(
        "/api/v1/auth/register",
        json={"name": "User B", "email": "userb@farm.org", "password": "password123"},
    )
    token_b = reg_b.json()["access_token"]

    forbidden_res = await client.get(
        f"/api/v1/scans/{scan_id_a}", headers={"Authorization": f"Bearer {token_b}"}
    )
    assert forbidden_res.status_code == 403
    assert forbidden_res.json()["error_code"] == "FORBIDDEN"
