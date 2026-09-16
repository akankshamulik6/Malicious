from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.clients.member1_ai_client import Member1AIClient
from app.clients.member2_advisory_client import Member2AdvisoryClient
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint for main backend and dependencies."""
    db_status = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "unreachable"

    ai_client = Member1AIClient()
    m1_health = await ai_client.get_health()

    advisory_client = Member2AdvisoryClient()
    m2_health = await advisory_client.get_health()

    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "dependencies": {
            "database": db_status,
            "member1_ai_service": m1_health.get("status", "unknown"),
            "member2_advisory_service": m2_health.get("status", "unknown"),
        },
    }
