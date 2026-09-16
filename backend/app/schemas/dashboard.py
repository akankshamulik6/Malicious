from typing import List
from pydantic import BaseModel, Field
from app.schemas.scan import ScanSummary


class FarmerDashboardSummary(BaseModel):
    total_scans: int
    healthy_scans: int
    diseased_scans: int
    recent_scans: List[ScanSummary] = Field(default_factory=list)
