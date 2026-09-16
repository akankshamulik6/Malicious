from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.v1.auth import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.dashboard import FarmerDashboardSummary
from app.schemas.error import ApiError
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Farmer Dashboard"])


@router.get(
    "/summary",
    response_model=FarmerDashboardSummary,
    responses={401: {"model": ApiError}},
)
async def get_dashboard_summary(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve farmer dashboard statistics computed from database records."""
    dashboard_service = DashboardService(db)
    return await dashboard_service.get_dashboard_summary(user_id=current_user.id)
