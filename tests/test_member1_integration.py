"""
Explicit Member 1 -> Member 2 integration test.

Sends the exact canonical Member 1 payload (as specified in the Member 2
integration brief) through POST /api/v1/advisory and verifies Member 2
adds agricultural information without modifying any of the fields it
received from Member 1.
"""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

CANONICAL_MEMBER1_PAYLOAD = {
    "scan_id": "scan_123456",
    "crop": "Tomato",
    "disease": "Tomato Early Blight",
    "status": "diseased",
    "confidence": 0.94,
    "model_name": "crop_disease_classifier",
    "model_version": "1.0.0",
    "processing_time_ms": 842,
    "explainability": {
        "method": "grad_cam",
        "available": True,
        "heatmap_url": None,
    },
    "detections": [],
}


def test_member1_canonical_payload_produces_correct_advisory():
    response = client.post(
        "/api/v1/advisory",
        json={"prediction": CANONICAL_MEMBER1_PAYLOAD},
    )
    assert response.status_code == 200
    advisory = response.json()

    # Member 1 fields must be preserved exactly.
    assert advisory["scan_id"] == "scan_123456"
    assert advisory["crop"] == "Tomato"
    assert advisory["disease"] == "Tomato Early Blight"
    assert advisory["status"] == "diseased"
    assert advisory["confidence"] == 0.94

    # Member 2 must have added agricultural information on top.
    assert advisory["advisory_status"] == "ready"
    assert advisory["description"]
    assert len(advisory["symptoms"]) > 0
    assert len(advisory["possible_causes"]) > 0
    assert advisory["severity"] in {"low", "moderate", "high", "unknown"}
    assert len(advisory["management_practices"]) > 0
    assert len(advisory["preventive_measures"]) > 0
    assert "disclaimer" in advisory and advisory["disclaimer"]


def test_member1_canonical_payload_with_location_still_preserves_prediction():
    response = client.post(
        "/api/v1/advisory",
        json={
            "prediction": CANONICAL_MEMBER1_PAYLOAD,
            "location": {
                "country": "India",
                "state": "Maharashtra",
                "district": "Pune",
                "latitude": None,
                "longitude": None,
            },
        },
    )
    assert response.status_code == 200
    advisory = response.json()

    assert advisory["crop"] == "Tomato"
    assert advisory["disease"] == "Tomato Early Blight"  # location never overrides this
    assert advisory["confidence"] == 0.94
    assert advisory["regional_insight"] is not None
    assert advisory["regional_insight"]["available"] is False  # never fabricated
