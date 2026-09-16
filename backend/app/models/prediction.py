import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Float, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id: Mapped[str] = mapped_column(String(36), ForeignKey("scans.id"), unique=True, index=True, nullable=False)
    crop: Mapped[str] = mapped_column(String(100), nullable=False)
    disease: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # "healthy", "diseased", "unknown"
    confidence: Mapped[float] = mapped_column(Float, nullable=False)  # 0.0 -> 1.0 float
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    processing_time_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    explainability_method: Mapped[str] = mapped_column(String(100), nullable=False)
    explainability_available: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    heatmap_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    scan = relationship("Scan", back_populates="prediction")
    detections = relationship("Detection", back_populates="prediction", cascade="all, delete-orphan")
