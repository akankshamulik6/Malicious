from fastapi.testclient import TestClient

from app.main import app
from tests.conftest import canonical_prediction_payload

client = TestClient(app)


def test_health_endpoint():
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_advisory_endpoint_diseased():
    payload = {
        "prediction": canonical_prediction_payload(),
        "location": {
            "country": "India",
            "state": "Maharashtra",
            "district": "Pune",
            "latitude": None,
            "longitude": None,
        },
    }
    resp = client.post("/api/v1/advisory", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["scan_id"] == "scan_123456"
    assert data["crop"] == "Tomato"
    assert data["disease"] == "Tomato Early Blight"
    assert data["confidence"] == 0.94
    assert data["advisory_status"] == "ready"
    assert data["severity"] in {"low", "moderate", "high", "unknown"}


def test_advisory_endpoint_unknown():
    payload = {
        "prediction": canonical_prediction_payload(
            scan_id="scan_999", disease="unknown", status="unknown", confidence=0.32
        )
    }
    resp = client.post("/api/v1/advisory", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["advisory_status"] == "requires_review"


def test_advisory_endpoint_healthy():
    payload = {
        "prediction": canonical_prediction_payload(
            scan_id="scan_healthy", disease="healthy", status="healthy", confidence=0.96
        )
    }
    resp = client.post("/api/v1/advisory", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["advisory_status"] == "ready"
    assert data["symptoms"] == []


def test_advisory_endpoint_not_available():
    payload = {
        "prediction": canonical_prediction_payload(
            scan_id="scan_unsupported", crop="Rice", disease="Rice Blast"
        )
    }
    resp = client.post("/api/v1/advisory", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["advisory_status"] == "not_available"
    assert data["severity"] == "unknown"


def test_advisory_endpoint_invalid_confidence_returns_invalid_prediction():
    payload = {"prediction": canonical_prediction_payload(scan_id="scan_bad", confidence=1.5)}
    resp = client.post("/api/v1/advisory", json=payload)
    assert resp.status_code == 422
    assert resp.json()["error_code"] == "INVALID_PREDICTION"


def test_advisory_endpoint_invalid_status_returns_invalid_prediction():
    payload = {"prediction": canonical_prediction_payload(scan_id="scan_bad2", status="infected")}
    resp = client.post("/api/v1/advisory", json=payload)
    assert resp.status_code == 422
    assert resp.json()["error_code"] == "INVALID_PREDICTION"


def test_advisory_endpoint_invalid_location_returns_invalid_location():
    payload = {
        "prediction": canonical_prediction_payload(scan_id="scan_bad3"),
        "location": {"latitude": 200.0},
    }
    resp = client.post("/api/v1/advisory", json=payload)
    assert resp.status_code == 422
    assert resp.json()["error_code"] == "INVALID_LOCATION"


def test_advisory_endpoint_missing_prediction_returns_invalid_prediction():
    # A request body with no "prediction" key at all is fundamentally an
    # invalid/missing prediction, not a generic request-shape problem.
    resp = client.post("/api/v1/advisory", json={})
    assert resp.status_code == 422
    assert resp.json()["error_code"] == "INVALID_PREDICTION"


def test_advisory_endpoint_malformed_json_body_returns_invalid_request():
    # A body that isn't even a JSON object (e.g. a bare string) fails at
    # the top-level "body" location, unrelated to prediction/location.
    resp = client.post(
        "/api/v1/advisory",
        content=b'"just a string"',
        headers={"Content-Type": "application/json"},
    )
    assert resp.status_code == 422
    assert resp.json()["error_code"] == "INVALID_REQUEST"


def test_get_disease_known():
    resp = client.get("/api/v1/diseases/Tomato/Tomato Early Blight")
    assert resp.status_code == 200
    data = resp.json()
    assert data["crop"] == "Tomato"
    assert data["severity"] in {"low", "moderate", "high", "unknown"}


def test_get_disease_not_found():
    resp = client.get("/api/v1/diseases/Rice/Rice Blast")
    assert resp.status_code == 404
    assert resp.json()["detail"]["error_code"] == "DISEASE_NOT_FOUND"


def test_get_disease_case_normalized():
    resp = client.get("/api/v1/diseases/tomato/TOMATO EARLY BLIGHT")
    assert resp.status_code == 200
    assert resp.json()["crop"] == "Tomato"
