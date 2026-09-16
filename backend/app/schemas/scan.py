from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.prediction import DiseaseStatus, PredictionResponse
from app.schemas.advisory import AgriculturalAdvisory


class ScanProcessingStatus(str, Enum):
    PENDING = "pending"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    FAILED = "failed"


class CropScanResult(BaseModel):
    prediction: PredictionResponse
    advisory: Optional[AgriculturalAdvisory] = None


class ScanSummary(BaseModel):
    scan_id: str
    crop: str
    disease: str
    status: DiseaseStatus
    confidence: float
    created_at: datetime
