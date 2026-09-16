from typing import Optional, List, Literal
from pydantic import BaseModel, Field
from app.schemas.prediction import DiseaseStatus


class RegionalInsight(BaseModel):
    available: bool
    region: Optional[str] = None
    trend: Optional[str] = None
    source: Optional[str] = None
    observed_period: Optional[str] = None


class AgriculturalAdvisory(BaseModel):
    scan_id: str
    crop: str
    disease: str
    status: DiseaseStatus
    confidence: float
    description: Optional[str] = None
    symptoms: List[str] = Field(default_factory=list)
    possible_causes: List[str] = Field(default_factory=list)
    severity: Literal["low", "moderate", "high", "unknown"]
    management_practices: List[str] = Field(default_factory=list)
    preventive_measures: List[str] = Field(default_factory=list)
    regional_insight: Optional[RegionalInsight] = None
    advisory_status: Literal["ready", "requires_review", "not_available"]
