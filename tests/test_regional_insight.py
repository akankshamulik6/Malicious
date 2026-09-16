from app.schemas.location import LocationContext, RegionalTrend
from app.services.regional_insight_service import RegionalInsightService


def test_no_location_returns_none():
    service = RegionalInsightService()
    result = service.get_regional_insight("Tomato", "Tomato Early Blight", None)
    assert result is None


def test_location_with_no_region_fields_returns_none():
    service = RegionalInsightService()
    location = LocationContext(latitude=18.5, longitude=73.8)
    result = service.get_regional_insight("Tomato", "Tomato Early Blight", location)
    assert result is None


def test_location_with_region_returns_unavailable_insight():
    service = RegionalInsightService()
    location = LocationContext(country="India", state="Maharashtra", district="Pune")
    result = service.get_regional_insight("Tomato", "Tomato Early Blight", location)

    assert result is not None
    assert result.available is False
    assert result.region == "Pune"
    assert result.trend is None
    assert result.source is None
    assert result.observed_period is None


def test_no_fabricated_statistics_across_region_granularity():
    service = RegionalInsightService()
    for location in [
        LocationContext(country="India"),
        LocationContext(state="Maharashtra"),
        LocationContext(district="Pune"),
    ]:
        result = service.get_regional_insight("Tomato", "Tomato Early Blight", location)
        assert result.available is False
        assert result.trend is None
        assert result.source is None
        assert result.observed_period is None


def test_trend_vocabulary_is_controlled():
    # Only these four values are ever valid for RegionalTrend.
    assert {t.value for t in RegionalTrend} == {"increasing", "decreasing", "stable", "unknown"}
