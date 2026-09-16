import uuid
from datetime import datetime, timezone
from typing import Optional, Any
from sqlalchemy import String, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Advisory(Base):
    __tablename__ = "advisories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id: Mapped[str] = mapped_column(String(36), ForeignKey("scans.id"), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    symptoms: Mapped[Any] = mapped_column(JSON, default=lambda: [], nullable=False)
    possible_causes: Mapped[Any] = mapped_column(JSON, default=lambda: [], nullable=False)
    severity: Mapped[str] = mapped_column(String(50), nullable=False)  # "low", "moderate", "high", "unknown"
    management_practices: Mapped[Any] = mapped_column(JSON, default=lambda: [], nullable=False)
    preventive_measures: Mapped[Any] = mapped_column(JSON, default=lambda: [], nullable=False)
    regional_insight: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    advisory_status: Mapped[str] = mapped_column(String(50), nullable=False)  # "ready", "requires_review", "not_available"
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    scan = relationship("Scan", back_populates="advisory")
