from typing import Optional, List, Tuple
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.scan import Scan
from app.models.prediction import Prediction
from app.models.advisory import Advisory


class ScanRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_scan(
        self,
        scan_id: str,
        user_id: str,
        status: str = "pending",
        country: Optional[str] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        image_reference: Optional[str] = None,
    ) -> Scan:
        scan = Scan(
            id=scan_id,
            user_id=user_id,
            status=status,
            country=country,
            state=state,
            district=district,
            latitude=latitude,
            longitude=longitude,
            image_reference=image_reference,
        )
        self.session.add(scan)
        await self.session.commit()
        await self.session.refresh(scan)
        return scan

    async def update_status(self, scan_id: str, status: str) -> Optional[Scan]:
        stmt = select(Scan).where(Scan.id == scan_id)
        result = await self.session.execute(stmt)
        scan = result.scalar_one_or_none()
        if scan:
            scan.status = status
            await self.session.commit()
            await self.session.refresh(scan)
        return scan

    async def get_scan_by_id(self, scan_id: str, user_id: Optional[str] = None) -> Optional[Scan]:
        stmt = (
            select(Scan)
            .options(
                selectinload(Scan.prediction).selectinload(Prediction.detections),
                selectinload(Scan.advisory),
            )
            .where(Scan.id == scan_id)
        )
        if user_id is not None:
            stmt = stmt.where(Scan.user_id == user_id)

        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_user_scans(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        crop: Optional[str] = None,
    ) -> List[Scan]:
        stmt = (
            select(Scan)
            .options(
                selectinload(Scan.prediction),
                selectinload(Scan.advisory),
            )
            .where(Scan.user_id == user_id)
        )

        if status:
            stmt = stmt.where(Scan.status == status)

        if crop:
            stmt = stmt.join(Scan.prediction).where(Prediction.crop.ilike(f"%{crop}%"))

        stmt = stmt.order_by(Scan.created_at.desc())

        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_user_dashboard_counts(self, user_id: str) -> Tuple[int, int, int]:
        """Returns (total_scans, healthy_scans, diseased_scans) based on stored prediction status."""
        total_stmt = select(func.count(Scan.id)).where(Scan.user_id == user_id, Scan.status == "completed")
        total_res = await self.session.execute(total_stmt)
        total_scans = total_res.scalar() or 0

        healthy_stmt = (
            select(func.count(Scan.id))
            .join(Scan.prediction)
            .where(Scan.user_id == user_id, Scan.status == "completed", Prediction.status == "healthy")
        )
        healthy_res = await self.session.execute(healthy_stmt)
        healthy_scans = healthy_res.scalar() or 0

        diseased_stmt = (
            select(func.count(Scan.id))
            .join(Scan.prediction)
            .where(Scan.user_id == user_id, Scan.status == "completed", Prediction.status == "diseased")
        )
        diseased_res = await self.session.execute(diseased_stmt)
        diseased_scans = diseased_res.scalar() or 0

        return total_scans, healthy_scans, diseased_scans
