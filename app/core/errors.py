"""
Canonical Member 2 error codes.

See AGRICULTURAL_INTEGRATION_CONTRACT.md section 6 for the full table of
codes, HTTP statuses, and when each is used.
"""
from __future__ import annotations


class ErrorCode:
    INVALID_PREDICTION = "INVALID_PREDICTION"
    INVALID_LOCATION = "INVALID_LOCATION"
    DISEASE_NOT_FOUND = "DISEASE_NOT_FOUND"
    ADVISORY_NOT_AVAILABLE = "ADVISORY_NOT_AVAILABLE"
    REGIONAL_DATA_UNAVAILABLE = "REGIONAL_DATA_UNAVAILABLE"
    INVALID_REQUEST = "INVALID_REQUEST"
    INTERNAL_ERROR = "INTERNAL_ERROR"


def classify_validation_error(errors: list[dict]) -> str:
    """Classify a FastAPI/Pydantic RequestValidationError's `errors()`
    list into one of our canonical error codes, based on which part of
    the request body the failing field(s) belong to.

    - Any error under body -> prediction -> INVALID_PREDICTION
    - Any error under body -> location -> INVALID_LOCATION
    - Anything else -> INVALID_REQUEST

    Prediction errors take priority when a request has errors in both
    sections, since a bad prediction is the more fundamental problem.
    """
    saw_location_error = False

    for error in errors:
        loc = error.get("loc", ())
        if len(loc) >= 2 and loc[0] == "body":
            if loc[1] == "prediction":
                return ErrorCode.INVALID_PREDICTION
            if loc[1] == "location":
                saw_location_error = True

    if saw_location_error:
        return ErrorCode.INVALID_LOCATION

    return ErrorCode.INVALID_REQUEST
