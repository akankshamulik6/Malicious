from app.schemas.advisory import AdvisoryStatus, Severity
from app.schemas.location import LocationContext
from tests.conftest import make_prediction


def test_diseased_advisory_ready(advisory_service):
    prediction = make_prediction()
    advisory = advisory_service.build_advisory(prediction)

    assert advisory.advisory_status == AdvisoryStatus.READY
    assert advisory.severity in {Severity.LOW, Severity.MODERATE, Severity.HIGH, Severity.UNKNOWN}
    assert len(advisory.symptoms) > 0
    assert len(advisory.management_practices) > 0
    assert len(advisory.preventive_measures) > 0


def test_healthy_advisory_no_disease_content(advisory_service):
    prediction = make_prediction(disease="healthy", status="healthy", confidence=0.96)
    advisory = advisory_service.build_advisory(prediction)

    assert advisory.advisory_status == AdvisoryStatus.READY
    assert advisory.status == "healthy"
    assert advisory.symptoms == []
    assert advisory.possible_causes == []
    assert len(advisory.preventive_measures) > 0
    assert len(advisory.management_practices) > 0


def test_unknown_advisory_requires_review(advisory_service):
    prediction = make_prediction(disease="unknown", status="unknown", confidence=0.32)
    advisory = advisory_service.build_advisory(prediction)

    assert advisory.advisory_status == AdvisoryStatus.REQUIRES_REVIEW
    assert advisory.symptoms == []
    assert advisory.possible_causes == []
    assert advisory.severity == Severity.UNKNOWN


def test_unknown_advisory_no_fuzzy_matching(advisory_service):
    # An "unknown" disease must never be matched to a real disease record,
    # even though the crop is one we have knowledge for.
    prediction = make_prediction(crop="Tomato", disease="unknown", status="unknown", confidence=0.2)
    advisory = advisory_service.build_advisory(prediction)

    assert advisory.advisory_status == AdvisoryStatus.REQUIRES_REVIEW
    assert advisory.description != None  # noqa: E711 - explicit sanity check
    assert "Tomato Early Blight" not in (advisory.description or "")
    assert advisory.management_practices  # general next-step guidance present


def test_missing_knowledge_returns_not_available(advisory_service):
    prediction = make_prediction(crop="Rice", disease="Rice Blast")
    advisory = advisory_service.build_advisory(prediction)

    assert advisory.advisory_status == AdvisoryStatus.NOT_AVAILABLE
    assert advisory.description == "Detailed advisory is not currently available for this disease."
    assert advisory.symptoms == []
    assert advisory.possible_causes == []
    assert advisory.severity == Severity.UNKNOWN
    assert advisory.management_practices == []
    assert advisory.preventive_measures == []
    # crop/disease/status/confidence must still pass through untouched
    assert advisory.crop == "Rice"
    assert advisory.disease == "Rice Blast"
    assert advisory.confidence == 0.94


def test_low_confidence_triggers_requires_review(advisory_service):
    prediction = make_prediction(confidence=0.3)
    advisory = advisory_service.build_advisory(prediction)

    assert advisory.advisory_status == AdvisoryStatus.REQUIRES_REVIEW


def test_confidence_is_never_modified(advisory_service):
    prediction = make_prediction(confidence=0.94)
    advisory = advisory_service.build_advisory(prediction)
    assert advisory.confidence == 0.94  # not 94, not rounded, not rescaled


def test_severity_not_derived_from_confidence(advisory_service):
    # Two predictions, same disease, wildly different confidence -
    # severity must come from the knowledge base, not confidence.
    high_conf = make_prediction(confidence=0.99)
    low_conf = make_prediction(confidence=0.55)

    advisory_high = advisory_service.build_advisory(high_conf)
    advisory_low = advisory_service.build_advisory(low_conf)

    assert advisory_high.severity == advisory_low.severity
    assert advisory_high.severity == Severity.MODERATE  # from the knowledge base record


def test_all_severity_levels_representable(advisory_service, repository):
    # Exercise each disease record in the sample knowledge base and
    # confirm every level in the Severity enum is reachable from real data.
    seen_severities = set()
    for crop, disease in repository.list_supported():
        prediction = make_prediction(crop=crop, disease=disease)
        advisory = advisory_service.build_advisory(prediction)
        seen_severities.add(advisory.severity)

    assert Severity.LOW in seen_severities
    assert Severity.MODERATE in seen_severities
    assert Severity.HIGH in seen_severities


def test_location_does_not_override_disease(advisory_service):
    prediction = make_prediction()
    location = LocationContext(country="India", state="Maharashtra", district="Pune")
    advisory = advisory_service.build_advisory(prediction, location=location)

    assert advisory.disease == "Tomato Early Blight"
    assert advisory.crop == "Tomato"


def test_regional_insight_never_fabricated(advisory_service):
    prediction = make_prediction()
    location = LocationContext(country="India", state="Maharashtra", district="Pune")
    advisory = advisory_service.build_advisory(prediction, location=location)

    assert advisory.regional_insight is not None
    assert advisory.regional_insight.available is False
    assert advisory.regional_insight.trend is None
    assert advisory.regional_insight.source is None


def test_regional_insight_none_without_location(advisory_service):
    prediction = make_prediction()
    advisory = advisory_service.build_advisory(prediction, location=None)
    assert advisory.regional_insight is None


# --- Explicit Member 1 field consistency (spec section 27) -----------------


def test_advisory_preserves_all_member1_fields_diseased(advisory_service):
    prediction = make_prediction()
    advisory = advisory_service.build_advisory(prediction)

    assert advisory.scan_id == prediction.scan_id
    assert advisory.crop == prediction.crop
    assert advisory.disease == prediction.disease
    assert advisory.status == prediction.status
    assert advisory.confidence == prediction.confidence


def test_advisory_preserves_all_member1_fields_healthy(advisory_service):
    prediction = make_prediction(disease="healthy", status="healthy", confidence=0.96)
    advisory = advisory_service.build_advisory(prediction)

    assert advisory.scan_id == prediction.scan_id
    assert advisory.crop == prediction.crop
    assert advisory.disease == prediction.disease
    assert advisory.status == prediction.status
    assert advisory.confidence == prediction.confidence


def test_advisory_preserves_all_member1_fields_unknown(advisory_service):
    prediction = make_prediction(disease="unknown", status="unknown", confidence=0.32)
    advisory = advisory_service.build_advisory(prediction)

    assert advisory.scan_id == prediction.scan_id
    assert advisory.crop == prediction.crop
    assert advisory.disease == prediction.disease
    assert advisory.status == prediction.status
    assert advisory.confidence == prediction.confidence


def test_advisory_preserves_all_member1_fields_not_available(advisory_service):
    prediction = make_prediction(crop="Rice", disease="Rice Blast")
    advisory = advisory_service.build_advisory(prediction)

    assert advisory.scan_id == prediction.scan_id
    assert advisory.crop == prediction.crop
    assert advisory.disease == prediction.disease
    assert advisory.status == prediction.status
    assert advisory.confidence == prediction.confidence
