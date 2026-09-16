from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.v1.auth import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.prediction import DiseaseStatus
from app.schemas.scan import ScanSummary
from app.schemas.error import ApiError
from app.services.scan_service import ScanService

router = APIRouter(prefix="/history", tags=["Scan History"])


@router.get(
    "",
    response_model=List[ScanSummary],
    responses={401: {"model": ApiError}},
)
async def get_scan_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[DiseaseStatus] = Query(None),
    crop: Optional[str] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve farmer scan history."""
    scan_service = ScanService(db)
    status_str = status.value if status else None
    return await scan_service.list_user_scans(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        status=status_str,
        crop=crop,
    )
