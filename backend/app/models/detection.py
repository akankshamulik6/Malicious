import uuid
from typing import Optional
from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Detection(Base):
    __tablename__ = "detections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    prediction_id: Mapped[str] = mapped_column(String(36), ForeignKey("predictions.id"), index=True, nullable=False)
    class_name: Mapped[str] = mapped_column(String(100), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    x1: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    y1: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    x2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    y2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    prediction = relationship("Prediction", back_populates="detections")
