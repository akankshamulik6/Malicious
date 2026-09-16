import pytest
import httpx
from unittest.mock import patch, AsyncMock
from app.clients.member2_advisory_client import Member2AdvisoryClient
from app.schemas.prediction import PredictionResponse, DiseaseStatus, ExplainabilityResult
from app.schemas.advisory import AgriculturalAdvisory


@pytest.mark.asyncio
async def test_member2_client_success():
    prediction = PredictionResponse(
        scan_id="scan_test_123",
        crop="Tomato",
        disease="Tomato Early Blight",
        status=DiseaseStatus.DISEASED,
        confidence=0.94,
        model_name="crop_disease_classifier",
        model_version="1.0.0",
        processing_time_ms=842,
        explainability=ExplainabilityResult(method="grad_cam", available=True),
        detections=[],
    )

    mock_advisory_res = {
        "scan_id": "scan_test_123",
        "crop": "Tomato",
        "disease": "Tomato Early Blight",
        "status": "diseased",
        "confidence": 0.94,
        "description": "Fungal infection",
        "symptoms": ["Dark brown spots"],
        "possible_causes": ["Alternaria solani"],
        "severity": "moderate",
        "management_practices": ["Apply fungicide"],
        "preventive_measures": ["Rotate crops"],
        "regional_insight": None,
        "advisory_status": "ready",
    }

    client = Member2AdvisoryClient(base_url="http://mock-advisory-service")

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = httpx.Response(200, json=mock_advisory_res)
        res = await client.get_advisory(prediction=prediction)

        assert isinstance(res, AgriculturalAdvisory)
        assert res.scan_id == "scan_test_123"
        assert res.severity == "moderate"


@pytest.mark.asyncio
async def test_member2_client_unavailable_returns_none():
    prediction = PredictionResponse(
        scan_id="scan_test_123",
        crop="Tomato",
        disease="Tomato Early Blight",
        status=DiseaseStatus.DISEASED,
        confidence=0.94,
        model_name="crop_disease_classifier",
        model_version="1.0.0",
        processing_time_ms=842,
        explainability=ExplainabilityResult(method="grad_cam", available=True),
        detections=[],
    )

    client = Member2AdvisoryClient(base_url="http://mock-advisory-service")

    with patch("httpx.AsyncClient.post", side_effect=httpx.ConnectError("Connection refused")):
        res = await client.get_advisory(prediction=prediction)
        assert res is None
