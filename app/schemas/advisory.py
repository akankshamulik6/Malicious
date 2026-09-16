from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field

from app.schemas.location import LocationContext, RegionalInsight
from app.schemas.prediction import DiseaseStatus, PredictionResponse


class AdvisoryStatus(str, Enum):
    READY = "ready"
    REQUIRES_REVIEW = "requires_review"
    NOT_AVAILABLE = "not_available"


class Severity(str, Enum):
    """Controlled vocabulary for disease severity. This is an
    agricultural-knowledge attribute (disease impact/risk) and MUST NOT
    be derived from AI prediction confidence (model certainty). The two
    concepts are unrelated."""

    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    UNKNOWN = "unknown"


class DiseaseInformation(BaseModel):
    """Canonical internal agricultural knowledge record."""

    crop: str
    disease: str
    description: str
    symptoms: list[str] = Field(default_factory=list)
    possible_causes: list[str] = Field(default_factory=list)
    severity: Severity = Severity.UNKNOWN
    management_practices: list[str] = Field(default_factory=list)
    preventive_measures: list[str] = Field(default_factory=list)
    source: str | None = None
    source_url: str | None = None
    last_verified: str | None = None


class AdvisoryRequest(BaseModel):
    """POST /api/v1/advisory request body."""

    prediction: PredictionResponse
    location: LocationContext | None = None


class AgriculturalAdvisory(BaseModel):
    """Standardized Member 2 -> (Member 4 / Member 3) response.

    scan_id / crop / disease / status / confidence are passed through
    verbatim from Member 1's PredictionResponse and MUST NOT be altered.
    """

    scan_id: str
    crop: str
    disease: str
    status: DiseaseStatus
    confidence: float

    description: str | None = None
    symptoms: list[str] = Field(default_factory=list)
    possible_causes: list[str] = Field(default_factory=list)
    severity: Severity = Severity.UNKNOWN
    management_practices: list[str] = Field(default_factory=list)
    preventive_measures: list[str] = Field(default_factory=list)

    regional_insight: RegionalInsight | None = None
    advisory_status: AdvisoryStatus

    disclaimer: str = (
        "This result is AI-generated and should be used as general "
        "guidance. For serious or uncertain crop problems, consult a "
        "qualified agricultural expert."
    )
