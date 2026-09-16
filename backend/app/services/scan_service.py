import uuid
import logging
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.scan_repository import ScanRepository
from app.repositories.prediction_repository import PredictionRepository
from app.repositories.advisory_repository import AdvisoryRepository
from app.clients.member1_ai_client import Member1AIClient
from app.clients.member2_advisory_client import Member2AdvisoryClient
from app.schemas.location import LocationContext
from app.schemas.prediction import (
    PredictionResponse,
    ExplainabilityResult,
    DetectionResult,
    BoundingBox,
    DiseaseStatus,
)
from app.schemas.advisory import AgriculturalAdvisory, RegionalInsight
from app.schemas.scan import CropScanResult, ScanSummary, ScanProcessingStatus
from app.core.exceptions import (
    ScanNotFoundException,
    ForbiddenException,
    InvalidImageException,
    AIServiceUnavailableException,
)

logger = logging.getLogger(__name__)


class ScanService:
    def __init__(
        self,
        session: AsyncSession,
        ai_client: Optional[Member1AIClient] = None,
        advisory_client: Optional[Member2AdvisoryClient] = None,
    ):
        self.session = session
        self.scan_repo = ScanRepository(session)
        self.pred_repo = PredictionRepository(session)
        self.adv_repo = AdvisoryRepository(session)
        self.ai_client = ai_client or Member1AIClient()
        self.advisory_client = advisory_client or Member2AdvisoryClient()

    async def create_and_process_scan(
        self,
        user_id: str,
        image_bytes: bytes,
        filename: str = "image.jpg",
        location: Optional[LocationContext] = None,
    ) -> CropScanResult:
        if not image_bytes or len(image_bytes) == 0:
            raise InvalidImageException("Uploaded image file is empty.")

        # 1. Generate scan_id
        scan_id = str(uuid.uuid4())

        # 2. Create scan record in database
        location_data = location or LocationContext()
        scan = await self.scan_repo.create_scan(
            scan_id=scan_id,
            user_id=user_id,
            status=ScanProcessingStatus.ANALYZING.value,
            country=location_data.country,
            state=location_data.state,
            district=location_data.district,
            latitude=location_data.latitude,
            longitude=location_data.longitude,
            image_reference=f"uploads/{scan_id}_{filename}",
        )

        try:
            # 3. Call Member 1 AI Service
            prediction: PredictionResponse = await self.ai_client.predict(
                scan_id=scan_id,
                image_bytes=image_bytes,
                filename=filename,
            )

            # Enforce scan_id consistency
            if prediction.scan_id != scan_id:
                prediction = prediction.model_copy(update={"scan_id": scan_id})

            # 4. Store prediction in database
            await self.pred_repo.create_prediction(prediction)

            # 5. Call Member 2 Advisory Service
            advisory: Optional[AgriculturalAdvisory] = await self.advisory_client.get_advisory(
                prediction=prediction,
                location=location_data,
            )

            if advisory is not None:
                # Validate response consistency (Section 51 & 53)
                if (
                    advisory.scan_id != prediction.scan_id
                    or advisory.crop != prediction.crop
                    or advisory.disease != prediction.disease
                    or advisory.status != prediction.status
                    or abs(advisory.confidence - prediction.confidence) > 1e-4
                ):
                    logger.warning(
                        f"Inconsistency detected in Member 2 advisory for scan_id={scan_id}. "
                        "Overriding advisory duplicate AI fields with authoritative Member 1 prediction values."
                    )
                    advisory = advisory.model_copy(
                        update={
                            "scan_id": prediction.scan_id,
                            "crop": prediction.crop,
                            "disease": prediction.disease,
                            "status": prediction.status,
                            "confidence": prediction.confidence,
                        }
                    )

                # Store advisory in database
                await self.adv_repo.create_advisory(advisory)

            # 6. Update scan status to COMPLETED
            await self.scan_repo.update_status(scan_id, ScanProcessingStatus.COMPLETED.value)

            return CropScanResult(prediction=prediction, advisory=advisory)

        except Exception as exc:
            # Mark scan status as FAILED in database
            await self.scan_repo.update_status(scan_id, ScanProcessingStatus.FAILED.value)
            logger.error(f"Scan orchestration failed for scan_id={scan_id}: {exc}")
            raise exc

    async def get_scan_detail(self, scan_id: str, user_id: str) -> CropScanResult:
        scan = await self.scan_repo.get_scan_by_id(scan_id)
        if not scan:
            raise ScanNotFoundException(f"Scan with ID '{scan_id}' not found.")

        if scan.user_id != user_id:
            raise ForbiddenException("You do not have permission to view this scan.")

        if not scan.prediction:
            raise ScanNotFoundException("Scan prediction data is not available.")

        # Reconstruct PredictionResponse
        p = scan.prediction
        detections = []
        for d in p.detections:
            bbox = None
            if d.x1 is not None and d.y1 is not None and d.x2 is not None and d.y2 is not None:
                bbox = BoundingBox(x1=d.x1, y1=d.y1, x2=d.x2, y2=d.y2)
            detections.append(DetectionResult(class_name=d.class_name, confidence=d.confidence, bounding_box=bbox))

        prediction = PredictionResponse(
            scan_id=scan.id,
            crop=p.crop,
            disease=p.disease,
            status=DiseaseStatus(p.status),
            confidence=p.confidence,
            model_name=p.model_name,
            model_version=p.model_version,
            processing_time_ms=p.processing_time_ms,
            explainability=ExplainabilityResult(
                method=p.explainability_method,
                available=p.explainability_available,
                heatmap_url=p.heatmap_url,
            ),
            detections=detections,
        )

        # Reconstruct AgriculturalAdvisory if present
        advisory = None
        if scan.advisory:
            a = scan.advisory
            regional_insight = None
            if a.regional_insight and isinstance(a.regional_insight, dict):
                regional_insight = RegionalInsight.model_validate(a.regional_insight)

            advisory = AgriculturalAdvisory(
                scan_id=scan.id,
                crop=p.crop,
                disease=p.disease,
                status=DiseaseStatus(p.status),
                confidence=p.confidence,
                description=a.description,
                symptoms=a.symptoms or [],
                possible_causes=a.possible_causes or [],
                severity=a.severity,
                management_practices=a.management_practices or [],
                preventive_measures=a.preventive_measures or [],
                regional_insight=regional_insight,
                advisory_status=a.advisory_status,
            )

        return CropScanResult(prediction=prediction, advisory=advisory)

    async def list_user_scans(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        crop: Optional[str] = None,
    ) -> List[ScanSummary]:
        if page_size > 100:
            page_size = 100

        scans = await self.scan_repo.list_user_scans(
            user_id=user_id,
            page=page,
            page_size=page_size,
            status=status,
            crop=crop,
        )

        summaries = []
        for s in scans:
            if s.prediction:
                summaries.append(
                    ScanSummary(
                        scan_id=s.id,
                        crop=s.prediction.crop,
                        disease=s.prediction.disease,
                        status=DiseaseStatus(s.prediction.status),
                        confidence=s.prediction.confidence,
                        created_at=s.created_at,
                    )
                )
        return summaries
