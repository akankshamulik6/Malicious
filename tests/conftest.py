import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest

from app.core.config import settings
from app.repositories.disease_repository import JsonDiseaseKnowledgeRepository
from app.services.advisory_service import AdvisoryService
from app.services.disease_lookup_service import DiseaseLookupService
from app.services.regional_insight_service import RegionalInsightService


@pytest.fixture
def repository():
    return JsonDiseaseKnowledgeRepository(settings.DISEASE_KNOWLEDGE_PATH)


@pytest.fixture
def advisory_service(repository):
    lookup_service = DiseaseLookupService(repository)
    regional_service = RegionalInsightService()
    return AdvisoryService(lookup_service, regional_service)


def canonical_prediction_payload(**overrides) -> dict:
    """The full canonical Member 1 -> Member 2 payload (section 30 of
    the Member 2 spec), with any fields overridden as needed."""
    base = dict(
        scan_id="scan_123456",
        crop="Tomato",
        disease="Tomato Early Blight",
        status="diseased",
        confidence=0.94,
        model_name="crop_disease_classifier",
        model_version="1.0.0",
        processing_time_ms=842,
        explainability={"method": "grad_cam", "available": True, "heatmap_url": None},
        detections=[],
    )
    base.update(overrides)
    return base


def make_prediction(**overrides):
    from app.schemas.prediction import PredictionResponse

    return PredictionResponse(**canonical_prediction_payload(**overrides))
