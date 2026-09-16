import pytest
from pydantic import ValidationError

from app.schemas.prediction import DiseaseStatus, PredictionResponse
from tests.conftest import canonical_prediction_payload


def test_valid_prediction_parses():
    pred = PredictionResponse(**canonical_prediction_payload())
    assert pred.scan_id == "scan_123456"
    assert pred.crop == "Tomato"
    assert pred.disease == "Tomato Early Blight"
    assert pred.status == DiseaseStatus.DISEASED
    assert pred.confidence == 0.94


def test_healthy_prediction():
    pred = PredictionResponse(
        **canonical_prediction_payload(disease="healthy", status="healthy", confidence=0.96)
    )
    assert pred.status == DiseaseStatus.HEALTHY


def test_diseased_prediction():
    pred = PredictionResponse(**canonical_prediction_payload(status="diseased"))
    assert pred.status == DiseaseStatus.DISEASED


def test_unknown_prediction():
    pred = PredictionResponse(
        **canonical_prediction_payload(disease="unknown", status="unknown", confidence=0.32)
    )
    assert pred.status == DiseaseStatus.UNKNOWN


def test_low_confidence_still_valid_prediction():
    pred = PredictionResponse(**canonical_prediction_payload(confidence=0.1))
    assert pred.confidence == 0.1


def test_confidence_zero_is_valid():
    pred = PredictionResponse(**canonical_prediction_payload(confidence=0.0))
    assert pred.confidence == 0.0


def test_confidence_one_is_valid():
    pred = PredictionResponse(**canonical_prediction_payload(confidence=1.0))
    assert pred.confidence == 1.0


def test_confidence_below_zero_rejected():
    with pytest.raises(ValidationError):
        PredictionResponse(**canonical_prediction_payload(confidence=-0.01))


def test_confidence_above_one_rejected():
    with pytest.raises(ValidationError):
        PredictionResponse(**canonical_prediction_payload(confidence=1.01))


def test_confidence_as_percentage_rejected():
    # 94 must never be silently accepted as "94%" -> 0.94
    with pytest.raises(ValidationError):
        PredictionResponse(**canonical_prediction_payload(confidence=94))


def test_invalid_status_rejected():
    with pytest.raises(ValidationError):
        PredictionResponse(**canonical_prediction_payload(status="infected"))


def test_missing_required_fields_rejected():
    payload = canonical_prediction_payload()
    del payload["scan_id"]
    with pytest.raises(ValidationError):
        PredictionResponse(**payload)

    payload = canonical_prediction_payload()
    del payload["model_name"]
    with pytest.raises(ValidationError):
        PredictionResponse(**payload)

    payload = canonical_prediction_payload()
    del payload["explainability"]
    with pytest.raises(ValidationError):
        PredictionResponse(**payload)


def test_confidence_never_rescaled_on_parse():
    pred = PredictionResponse(**canonical_prediction_payload(confidence=0.94))
    assert pred.confidence == 0.94  # not 94, never modified during parsing
