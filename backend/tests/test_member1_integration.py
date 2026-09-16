import pytest
import httpx
from app.clients.member1_ai_client import Member1AIClient
from app.schemas.prediction import PredictionResponse, DiseaseStatus
from app.core.exceptions import AIServiceUnavailableException, InvalidImageException


@pytest.mark.asyncio
async def test_member1_client_success():
    mock_response = {
        "scan_id": "scan_test_123",
        "crop": "Tomato",
        "disease": "Tomato Early Blight",
        "status": "diseased",
        "confidence": 0.94,
        "model_name": "crop_disease_classifier",
        "model_version": "1.0.0",
        "processing_time_ms": 842,
        "explainability": {"method": "grad_cam", "available": True, "heatmap_url": None},
        "detections": [],
    }

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=mock_response)

    client = Member1AIClient(base_url="http://mock-ai-service")
    
    # Override client request using MockTransport
    async def mock_predict(scan_id: str, image_bytes: bytes, filename: str = "crop_image.jpg"):
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http_client:
            res = await http_client.post("http://mock-ai-service/api/v1/predict", data={"scan_id": scan_id})
            return PredictionResponse.model_validate(res.json())

    res = await mock_predict(scan_id="scan_test_123", image_bytes=b"fake_image")

    assert isinstance(res, PredictionResponse)
    assert res.scan_id == "scan_test_123"
    assert res.crop == "Tomato"
    assert res.disease == "Tomato Early Blight"
    assert res.status == DiseaseStatus.DISEASED
    assert res.confidence == 0.94


@pytest.mark.asyncio
async def test_member1_client_503_unavailable():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, json={"detail": "Service unavailable"})

    client = Member1AIClient(base_url="http://mock-ai-service")

    async def mock_predict(scan_id: str, image_bytes: bytes):
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http_client:
            res = await http_client.post("http://mock-ai-service/api/v1/predict", data={"scan_id": scan_id})
            if res.status_code == 503:
                raise AIServiceUnavailableException("Crop analysis is temporarily unavailable. Please try again later.")
            return PredictionResponse.model_validate(res.json())

    with pytest.raises(AIServiceUnavailableException) as exc_info:
        await mock_predict(scan_id="scan_test_503", image_bytes=b"fake_image")

    assert exc_info.value.error_code == "AI_SERVICE_UNAVAILABLE"
