from __future__ import annotations

from functools import lru_cache

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.core.errors import ErrorCode
from app.ml.model import model
from app.repositories.disease_repository import JsonDiseaseKnowledgeRepository
from app.schemas.advisory import (
    AdvisoryRequest,
    AgriculturalAdvisory,
    DiseaseInformation,
)
from app.services.advisory_service import AdvisoryService
from app.services.disease_lookup_service import DiseaseLookupService
from app.services.regional_insight_service import RegionalInsightService


router = APIRouter(
    prefix=settings.API_PREFIX,
    tags=["advisory"],
)


@lru_cache
def get_repository() -> JsonDiseaseKnowledgeRepository:
    return JsonDiseaseKnowledgeRepository(
        settings.DISEASE_KNOWLEDGE_PATH
    )


def get_advisory_service() -> AdvisoryService:
    repository = get_repository()
    lookup_service = DiseaseLookupService(repository)
    regional_insight_service = RegionalInsightService()

    return AdvisoryService(
        lookup_service,
        regional_insight_service,
    )


@router.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "model_available": model.model_available,
    }


@router.post(
    "/advisory",
    response_model=AgriculturalAdvisory,
)
def create_advisory(
    request: AdvisoryRequest,
) -> AgriculturalAdvisory:
    try:
        service = get_advisory_service()

        return service.build_advisory(
            prediction=request.prediction,
            location=request.location,
        )

    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail={
                "error_code": ErrorCode.INTERNAL_ERROR,
                "message": str(exc),
            },
        ) from exc


@router.get(
    "/diseases/{crop}/{disease}",
    response_model=DiseaseInformation,
)
def get_disease(
    crop: str,
    disease: str,
) -> DiseaseInformation:
    repository = get_repository()

    info = repository.get_disease_information(
        crop,
        disease,
    )

    if info is None:
        raise HTTPException(
            status_code=404,
            detail={
                "error_code": ErrorCode.DISEASE_NOT_FOUND,
                "message": (
                    "No agricultural information is currently available "
                    "for the requested crop and disease."
                ),
            },
        )

    return info