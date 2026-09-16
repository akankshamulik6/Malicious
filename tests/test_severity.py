import pytest
from pydantic import ValidationError

from app.schemas.advisory import DiseaseInformation, Severity


def _make_info(severity):
    return DiseaseInformation(
        crop="Tomato",
        disease="Tomato Early Blight",
        description="Test description.",
        symptoms=["Test symptom."],
        possible_causes=["Test cause."],
        severity=severity,
        management_practices=["Test practice."],
        preventive_measures=["Test measure."],
    )


def test_severity_low():
    info = _make_info("low")
    assert info.severity == Severity.LOW


def test_severity_moderate():
    info = _make_info("moderate")
    assert info.severity == Severity.MODERATE


def test_severity_high():
    info = _make_info("high")
    assert info.severity == Severity.HIGH


def test_severity_unknown():
    info = _make_info("unknown")
    assert info.severity == Severity.UNKNOWN


def test_severity_defaults_to_unknown():
    info = DiseaseInformation(
        crop="Tomato",
        disease="Tomato Early Blight",
        description="Test description.",
    )
    assert info.severity == Severity.UNKNOWN


def test_severity_rejects_arbitrary_values():
    with pytest.raises(ValidationError):
        _make_info("Critical")

    with pytest.raises(ValidationError):
        _make_info("Danger")

    with pytest.raises(ValidationError):
        _make_info("Medium")
