from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.scan_repository import ScanRepository
from app.services.scan_service import ScanService
from app.schemas.dashboard import FarmerDashboardSummary


class DashboardService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.scan_repo = ScanRepository(session)
        self.scan_service = ScanService(session)

    async def get_dashboard_summary(self, user_id: str) -> FarmerDashboardSummary:
        total_scans, healthy_scans, diseased_scans = await self.scan_repo.get_user_dashboard_counts(user_id)
        recent_scans = await self.scan_service.list_user_scans(
            user_id=user_id,
            page=1,
            page_size=5,
        )

        return FarmerDashboardSummary(
            total_scans=total_scans,
            healthy_scans=healthy_scans,
            diseased_scans=diseased_scans,
            recent_scans=recent_scans,
        )
