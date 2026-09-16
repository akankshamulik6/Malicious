"""
Member 1 -> Member 2 contract.

These field names, types, and enum values are LOCKED and must never be
renamed or reinterpreted. See AGRICULTURAL_INTEGRATION_CONTRACT.md.

This module deliberately validates strictly against the canonical
Member 1 schema (all fields required, confidence bounded 0.0-1.0). If a
future Member 1 build needs to omit optional metadata, that should be
handled through an explicit adapter at the integration boundary rather
than by silently weakening this public contract.
"""
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field, ConfigDict


class DiseaseStatus(str, Enum):
    """Canonical status values produced by Member 1's model."""

    HEALTHY = "healthy"
    DISEASED = "diseased"
    UNKNOWN = "unknown"


class ExplainabilityResult(BaseModel):
    """Explainability metadata attached to a prediction. Passed through
    unmodified; Member 2 does not interpret or alter this object."""

    model_config = ConfigDict(extra="allow")

    method: str
    available: bool
    heatmap_url: str | None = None


class BoundingBox(BaseModel):
    """Pixel/normalized bounding box coordinates for a detection."""

    x1: float
    y1: float
    x2: float
    y2: float


class DetectionResult(BaseModel):
    """A single detection entry, if Member 1's model returns localized
    detections in addition to (or instead of) a single crop/disease
    prediction. Member 2 does not interpret these beyond passthrough."""

    model_config = ConfigDict(extra="allow")

    class_name: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    bounding_box: BoundingBox | None = None


class PredictionResponse(BaseModel):
    """Canonical Member 1 -> Member 2 prediction contract.

    Field names are LOCKED:
        scan_id, crop, disease, status, confidence, model_name,
        model_version, processing_time_ms, explainability, detections

    Do NOT rename to prediction_id, crop_name, disease_name, prediction,
    accuracy, probability, result, etc.
    """

    model_config = ConfigDict(extra="allow", protected_namespaces=())

    scan_id: str
    crop: str
    disease: str
    status: DiseaseStatus
    confidence: float = Field(..., ge=0.0, le=1.0)
    model_name: str
    model_version: str
    processing_time_ms: int
    explainability: ExplainabilityResult
    detections: list[DetectionResult] = Field(default_factory=list)
