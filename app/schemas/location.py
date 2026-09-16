from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class LocationContext(BaseModel):
    """Flexible, fully-optional farmer location. Never require precise
    GPS coordinates; all fields are optional so Member 4 can supply
    whatever granularity of location data it has."""

    country: str | None = None
    state: str | None = None
    district: str | None = None
    latitude: float | None = Field(default=None, ge=-90.0, le=90.0)
    longitude: float | None = Field(default=None, ge=-180.0, le=180.0)


class RegionalTrend(str, Enum):
    """Controlled vocabulary for regional disease trend direction.
    Never invent a value outside this set."""

    INCREASING = "increasing"
    DECREASING = "decreasing"
    STABLE = "stable"
    UNKNOWN = "unknown"


class RegionalInsight(BaseModel):
    """Regional disease-trend context. Must never be fabricated.

    When no reliable regional data exists, `available` MUST be False and
    all other fields MUST be None.
    """

    available: bool
    region: str | None = None
    trend: RegionalTrend | None = None
    source: str | None = None
    observed_period: str | None = None
