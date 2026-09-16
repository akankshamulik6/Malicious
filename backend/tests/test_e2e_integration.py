import pytest
from httpx import AsyncClient
from unittest.mock import patch
from app.schemas.prediction import PredictionResponse, DiseaseStatus, ExplainabilityResult
from app.schemas.advisory import AgriculturalAdvisory, RegionalInsight


@pytest.mark.asyncio
async def test_critical_e2e_integration_flow(client: AsyncClient, sample_image_bytes: bytes):
    """
    Real Integration Requirement Section 90 & 105:
    1. Register/Login farmer
    2. Open Scan & Upload crop image
    3. Member 4 generates scan_id
    4. Call Member 1 -> PredictionResponse
    5. Store prediction in DB
    6. Call Member 2 -> AgriculturalAdvisory
    7. Store advisory in DB
    8. Member 4 returns CropScanResult
    9. Retrieve same scan from DB & verify identical response
    10. Verify scan history & dashboard statistics reflect stored data
    """

    # 1. Register / Login farmer
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"name": "Kisan Patel", "email": "kisan@farm.org", "password": "password123", "language": "mr"},
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Prepare Member 1 prediction
    mock_prediction = PredictionResponse(
        scan_id="initial_temp_id",
        crop="Tomato",
        disease="Tomato Early Blight",
        status=DiseaseStatus.DISEASED,
        confidence=0.94,  # Float 0.0 -> 1.0
        model_name="crop_disease_classifier",
        model_version="1.0.0",
        processing_time_ms=842,
        explainability=ExplainabilityResult(method="grad_cam", available=True, heatmap_url=None),
        detections=[],
    )

    # Prepare Member 2 advisory
    mock_advisory = AgriculturalAdvisory(
        scan_id="initial_temp_id",
        crop="Tomato",
        disease="Tomato Early Blight",
        status=DiseaseStatus.DISEASED,
        confidence=0.94,
        description="Fungal spot infection causing dark spots with concentric rings.",
        symptoms=["Dark brown spots", "Concentric rings"],
        possible_causes=["Alternaria solani"],
        severity="moderate",
        management_practices=["Apply copper fungicide"],
        preventive_measures=["Crop rotation"],
        regional_insight=RegionalInsight(
            available=True,
            region="Maharashtra, India",
            trend="Seasonal spike",
            source="Agri Ext",
            observed_period="Q3 2026",
        ),
        advisory_status="ready",
    )

    with patch("app.clients.member1_ai_client.Member1AIClient.predict", return_value=mock_prediction), patch(
        "app.clients.member2_advisory_client.Member2AdvisoryClient.get_advisory", return_value=mock_advisory
    ):

        # 2. Upload crop image
        files = {"image": ("leaf_sample.jpg", sample_image_bytes, "image/jpeg")}
        data = {
            "country": "India",
            "state": "Maharashtra",
            "district": "Pune",
            "latitude": "18.5204",
            "longitude": "73.8567",
        }

        scan_response = await client.post("/api/v1/scans", headers=headers, files=files, data=data)
        assert scan_response.status_code == 201
        result = scan_response.json()

        # 3. Verify scan_id and responses
        assert "prediction" in result
        assert "advisory" in result
        scan_id = result["prediction"]["scan_id"]
        assert len(scan_id) > 10
        assert result["advisory"]["scan_id"] == scan_id
        assert result["prediction"]["confidence"] == 0.94
        assert result["prediction"]["status"] == "diseased"
        assert result["advisory"]["severity"] == "moderate"

        # 4. Refresh & Retrieve same scan from database
        fetch_res = await client.get(f"/api/v1/scans/{scan_id}", headers=headers)
        assert fetch_res.status_code == 200
        fetched_data = fetch_res.json()

        assert fetched_data["prediction"]["scan_id"] == scan_id
        assert fetched_data["prediction"]["crop"] == "Tomato"
        assert fetched_data["prediction"]["disease"] == "Tomato Early Blight"
        assert fetched_data["prediction"]["confidence"] == 0.94
        assert fetched_data["advisory"]["scan_id"] == scan_id
        assert fetched_data["advisory"]["severity"] == "moderate"

        # 5. Open History & verify scan appears
        hist_res = await client.get("/api/v1/scans", headers=headers)
        assert hist_res.status_code == 200
        history_list = hist_res.json()
        assert len(history_list) == 1
        assert history_list[0]["scan_id"] == scan_id
        assert history_list[0]["crop"] == "Tomato"
        assert history_list[0]["disease"] == "Tomato Early Blight"

        # 6. Open Dashboard & verify statistics
        dash_res = await client.get("/api/v1/dashboard/summary", headers=headers)
        assert dash_res.status_code == 200
        dash_stats = dash_res.json()
        assert dash_stats["total_scans"] == 1
        assert dash_stats["diseased_scans"] == 1
        assert dash_stats["healthy_scans"] == 0
        assert dash_stats["recent_scans"][0]["scan_id"] == scan_id
