from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class DiseaseStatus(str, Enum):
    HEALTHY = "healthy"
    DISEASED = "diseased"
    UNKNOWN = "unknown"


class ExplainabilityResult(BaseModel):
    method: str
    available: bool
    heatmap_url: Optional[str] = None


class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class DetectionResult(BaseModel):
    class_name: str
    confidence: float
    bounding_box: Optional[BoundingBox] = None


class PredictionResponse(BaseModel):
    scan_id: str
    crop: str
    disease: str
    status: DiseaseStatus
    confidence: float
    model_name: str
    model_version: str
    processing_time_ms: int
    explainability: ExplainabilityResult
    detections: List[DetectionResult] = Field(default_factory=list)
