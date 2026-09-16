import pytest
from pydantic import ValidationError

from app.schemas.location import LocationContext


def test_country_only():
    loc = LocationContext(country="India")
    assert loc.country == "India"
    assert loc.state is None


def test_state_only():
    loc = LocationContext(state="Maharashtra")
    assert loc.state == "Maharashtra"


def test_district_only():
    loc = LocationContext(district="Pune")
    assert loc.district == "Pune"


def test_latitude_longitude():
    loc = LocationContext(latitude=18.5204, longitude=73.8567)
    assert loc.latitude == 18.5204
    assert loc.longitude == 73.8567


def test_invalid_latitude_raises():
    with pytest.raises(ValidationError):
        LocationContext(latitude=120.0)


def test_invalid_longitude_raises():
    with pytest.raises(ValidationError):
        LocationContext(longitude=200.0)


def test_all_fields_optional():
    loc = LocationContext()
    assert loc.country is None
    assert loc.latitude is None
