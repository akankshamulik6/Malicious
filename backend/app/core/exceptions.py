from fastapi import HTTPException, status
from app.schemas.error import ApiError


class CustomApiException(HTTPException):
    def __init__(self, status_code: int, error_code: str, message: str):
        super().__init__(status_code=status_code, detail={"error_code": error_code, "message": message})
        self.error_code = error_code
        self.message = message


class InvalidImageException(CustomApiException):
    def __init__(self, message: str = "Invalid image file provided."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_IMAGE",
            message=message,
        )


class UnauthorizedException(CustomApiException):
    def __init__(self, message: str = "Authentication required or token invalid."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="UNAUTHORIZED",
            message=message,
        )


class ForbiddenException(CustomApiException):
    def __init__(self, message: str = "Access denied for this resource."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="FORBIDDEN",
            message=message,
        )


class ScanNotFoundException(CustomApiException):
    def __init__(self, message: str = "Requested scan was not found."):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="SCAN_NOT_FOUND",
            message=message,
        )


class AIServiceUnavailableException(CustomApiException):
    def __init__(self, message: str = "Crop analysis is temporarily unavailable. Please try again later."):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="AI_SERVICE_UNAVAILABLE",
            message=message,
        )


class AdvisoryServiceUnavailableException(CustomApiException):
    def __init__(self, message: str = "Agricultural advisory service is temporarily unavailable."):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="ADVISORY_SERVICE_UNAVAILABLE",
            message=message,
        )


class InvalidLocationException(CustomApiException):
    def __init__(self, message: str = "Invalid latitude or longitude coordinates."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_LOCATION",
            message=message,
        )


class DatabaseException(CustomApiException):
    def __init__(self, message: str = "Database operation failed."):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="DATABASE_ERROR",
            message=message,
        )


class InternalException(CustomApiException):
    def __init__(self, message: str = "An unexpected server error occurred."):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="INTERNAL_ERROR",
            message=message,
        )
