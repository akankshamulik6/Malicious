"""
RegionalInsightService

No real regional trend data source exists for this hackathon build, and
the module must never fabricate statistics. This service therefore
always reports `available = False` unless a real, documented data
source is wired in later. The location layer is used purely for context
and MUST NOT influence or override the AI-identified disease.

If a real source is wired in later, `trend` must be set to one of the
`RegionalTrend` enum values only (never an arbitrary string).
"""
from __future__ import annotations

from app.schemas.location import LocationContext, RegionalInsight


class RegionalInsightService:
    def get_regional_insight(
        self, crop: str, disease: str, location: LocationContext | None
    ) -> RegionalInsight | None:
        if location is None:
            return None

        has_region_context = any([location.country, location.state, location.district])
        if not has_region_context:
            return None

        # No authoritative regional trend data source is currently wired
        # in. Explicitly report unavailability rather than fabricating a
        # trend. When a real source is integrated, populate `trend`,
        # `source`, and `observed_period` from that source only.
        region_label = location.district or location.state or location.country
        return RegionalInsight(
            available=False,
            region=region_label,
            trend=None,
            source=None,
            observed_period=None,
        )
