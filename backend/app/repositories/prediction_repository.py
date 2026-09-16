from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.prediction import Prediction
from app.models.detection import Detection
from app.schemas.prediction import PredictionResponse


class PredictionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_prediction(self, prediction_data: PredictionResponse) -> Prediction:
        prediction = Prediction(
            scan_id=prediction_data.scan_id,
            crop=prediction_data.crop,
            disease=prediction_data.disease,
            status=prediction_data.status.value,
            confidence=float(prediction_data.confidence),  # Float 0.0 -> 1.0
            model_name=prediction_data.model_name,
            model_version=prediction_data.model_version,
            processing_time_ms=prediction_data.processing_time_ms,
            explainability_method=prediction_data.explainability.method,
            explainability_available=prediction_data.explainability.available,
            heatmap_url=prediction_data.explainability.heatmap_url,
        )
        self.session.add(prediction)
        await self.session.flush()

        for det in prediction_data.detections:
            detection = Detection(
                prediction_id=prediction.id,
                class_name=det.class_name,
                confidence=det.confidence,
                x1=det.bounding_box.x1 if det.bounding_box else None,
                y1=det.bounding_box.y1 if det.bounding_box else None,
                x2=det.bounding_box.x2 if det.bounding_box else None,
                y2=det.bounding_box.y2 if det.bounding_box else None,
            )
            self.session.add(detection)

        await self.session.commit()
        await self.session.refresh(prediction)
        return prediction

    async def get_by_scan_id(self, scan_id: str) -> Optional[Prediction]:
        stmt = select(Prediction).where(Prediction.scan_id == scan_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
