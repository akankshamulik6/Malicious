"""
AdvisoryService

Converts (AI prediction + agricultural knowledge + location) into a
farmer-friendly AgriculturalAdvisory.

Hard rules enforced here (see AGRICULTURAL_INTEGRATION_CONTRACT.md):
  - Never modify scan_id / crop / disease / status / confidence from the
    incoming Member 1 prediction.
  - Never infer severity from confidence.
  - Never fabricate disease information or regional statistics.
  - unknown status -> requires_review, no disease-specific content.
  - healthy status -> no disease treatment; preventive/monitoring only.
  - diseased status with no matching knowledge -> not_available.
"""
from __future__ import annotations

from app.core.config import settings
from app.schemas.advisory import AdvisoryStatus, AgriculturalAdvisory, Severity
from app.schemas.location import LocationContext
from app.schemas.prediction import DiseaseStatus, PredictionResponse
from app.services.disease_lookup_service import DiseaseLookupService
from app.services.regional_insight_service import RegionalInsightService

_HEALTHY_MANAGEMENT_PRACTICES = [
    "Continue routine field monitoring for early signs of pests or disease.",
    "Maintain balanced irrigation and nutrition for the crop.",
    "Keep field sanitation practices in place to reduce future disease risk.",
]

_HEALTHY_PREVENTIVE_MEASURES = [
    "Scout plants regularly, especially after rain or high-humidity periods.",
    "Avoid conditions that prolong leaf wetness where possible.",
    "Maintain good field sanitation and crop rotation practices.",
]

_UNKNOWN_RECOMMENDATIONS = [
    "Capture a clear, well-lit image of the affected leaf or plant part.",
    "Ensure the affected area fills a reasonable portion of the frame.",
    "Consider consulting a qualified agricultural expert if symptoms persist.",
]


class AdvisoryService:
    def __init__(
        self,
        lookup_service: DiseaseLookupService,
        regional_insight_service: RegionalInsightService,
    ):
        self._lookup_service = lookup_service
        self._regional_insight_service = regional_insight_service

    def build_advisory(
        self,
        prediction: PredictionResponse,
        location: LocationContext | None = None,
    ) -> AgriculturalAdvisory:
        # --- Unknown / low-confidence prediction --------------------------
        if prediction.status == DiseaseStatus.UNKNOWN or prediction.disease.strip().lower() == "unknown":
            return self._build_unknown_advisory(prediction)

        if prediction.confidence < settings.LOW_CONFIDENCE_THRESHOLD:
            return self._build_unknown_advisory(
                prediction,
                message=(
                    "The crop disease prediction has low confidence. "
                    "Please review before relying on this result."
                ),
            )

        # --- Healthy prediction --------------------------------------------
        if prediction.status == DiseaseStatus.HEALTHY:
            return self._build_healthy_advisory(prediction)

        # --- Diseased prediction --------------------------------------------
        return self._build_diseased_advisory(prediction, location)

    def _build_unknown_advisory(
        self, prediction: PredictionResponse, message: str | None = None
    ) -> AgriculturalAdvisory:
        return AgriculturalAdvisory(
            scan_id=prediction.scan_id,
            crop=prediction.crop,
            disease=prediction.disease,
            status=prediction.status,
            confidence=prediction.confidence,
            description=(
                message
                or "The crop disease could not be identified confidently from this image."
            ),
            symptoms=[],
            possible_causes=[],
            severity=Severity.UNKNOWN,
            management_practices=list(_UNKNOWN_RECOMMENDATIONS),
            preventive_measures=[],
            regional_insight=None,
            advisory_status=AdvisoryStatus.REQUIRES_REVIEW,
        )

    def _build_healthy_advisory(self, prediction: PredictionResponse) -> AgriculturalAdvisory:
        return AgriculturalAdvisory(
            scan_id=prediction.scan_id,
            crop=prediction.crop,
            disease=prediction.disease,
            status=prediction.status,
            confidence=prediction.confidence,
            description=(
                f"The {prediction.crop} plant appears healthy based on the submitted image. "
                "No disease was detected."
            ),
            symptoms=[],
            possible_causes=[],
            severity=Severity.UNKNOWN,
            management_practices=list(_HEALTHY_MANAGEMENT_PRACTICES),
            preventive_measures=list(_HEALTHY_PREVENTIVE_MEASURES),
            regional_insight=None,
            advisory_status=AdvisoryStatus.READY,
        )

    def _build_diseased_advisory(
        self,
        prediction: PredictionResponse,
        location: LocationContext | None,
    ) -> AgriculturalAdvisory:
        info = self._lookup_service.lookup(prediction.crop, prediction.disease)

        regional_insight = self._regional_insight_service.get_regional_insight(
            crop=prediction.crop,
            disease=prediction.disease,
            location=location,
        )

        if info is None:
            return AgriculturalAdvisory(
                scan_id=prediction.scan_id,
                crop=prediction.crop,
                disease=prediction.disease,
                status=prediction.status,
                confidence=prediction.confidence,
                description="Detailed advisory is not currently available for this disease.",
                symptoms=[],
                possible_causes=[],
                severity=Severity.UNKNOWN,
                management_practices=[],
                preventive_measures=[],
                regional_insight=regional_insight,
                advisory_status=AdvisoryStatus.NOT_AVAILABLE,
            )

        return AgriculturalAdvisory(
            scan_id=prediction.scan_id,
            crop=prediction.crop,
            disease=prediction.disease,
            status=prediction.status,
            confidence=prediction.confidence,
            description=info.description,
            symptoms=info.symptoms,
            possible_causes=info.possible_causes,
            severity=info.severity,
            management_practices=info.management_practices,
            preventive_measures=info.preventive_measures,
            regional_insight=regional_insight,
            advisory_status=AdvisoryStatus.READY,
        )
