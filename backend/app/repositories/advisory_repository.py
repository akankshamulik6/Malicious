from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.advisory import Advisory
from app.schemas.advisory import AgriculturalAdvisory


class AdvisoryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_advisory(self, advisory_data: AgriculturalAdvisory) -> Advisory:
        advisory = Advisory(
            scan_id=advisory_data.scan_id,
            description=advisory_data.description,
            symptoms=advisory_data.symptoms,
            possible_causes=advisory_data.possible_causes,
            severity=advisory_data.severity,
            management_practices=advisory_data.management_practices,
            preventive_measures=advisory_data.preventive_measures,
            regional_insight=advisory_data.regional_insight.model_dump() if advisory_data.regional_insight else None,
            advisory_status=advisory_data.advisory_status,
        )
        self.session.add(advisory)
        await self.session.commit()
        await self.session.refresh(advisory)
        return advisory

    async def get_by_scan_id(self, scan_id: str) -> Optional[Advisory]:
        stmt = select(Advisory).where(Advisory.scan_id == scan_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
