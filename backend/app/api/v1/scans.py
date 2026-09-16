from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.v1.auth import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.prediction import DiseaseStatus
from app.schemas.location import LocationContext
from app.schemas.scan import CropScanResult, ScanSummary
from app.schemas.error import ApiError
from app.services.scan_service import ScanService
from app.core.exceptions import InvalidImageException, InvalidLocationException

router = APIRouter(prefix="/scans", tags=["Crop Scans"])


@router.post(
    "",
    response_model=CropScanResult,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ApiError},
        401: {"model": ApiError},
        503: {"model": ApiError},
    },
)
async def create_scan(
    image: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    country: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    district: Optional[str] = Form(None),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload crop image, trigger AI disease detection & advisory orchestration."""
    # 1. Validate image format
    if not image.content_type or not image.content_type.startswith("image/"):
        if not (image.filename and image.filename.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))):
            raise InvalidImageException("Uploaded file must be a valid image (JPEG, PNG, WEBP).")

    # 2. Validate location bounds if provided
    if latitude is not None and not (-90.0 <= latitude <= 90.0):
        raise InvalidLocationException("Latitude must be between -90.0 and 90.0 degrees.")
    if longitude is not None and not (-180.0 <= longitude <= 180.0):
        raise InvalidLocationException("Longitude must be between -180.0 and 180.0 degrees.")

    location = LocationContext(
        country=country,
        state=state,
        district=district,
        latitude=latitude,
        longitude=longitude,
    )

    image_bytes = await image.read()
    filename = image.filename or "crop_image.jpg"

    scan_service = ScanService(db)
    return await scan_service.create_and_process_scan(
        user_id=current_user.id,
        image_bytes=image_bytes,
        filename=filename,
        location=location,
    )


@router.get(
    "",
    response_model=List[ScanSummary],
    responses={401: {"model": ApiError}},
)
async def list_scans(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[DiseaseStatus] = Query(None, description="Filter by disease status"),
    crop: Optional[str] = Query(None, description="Filter by crop name"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List historical scan summaries for authenticated farmer."""
    scan_service = ScanService(db)
    status_str = status.value if status else None
    return await scan_service.list_user_scans(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        status=status_str,
        crop=crop,
    )


@router.get(
    "/{scan_id}",
    response_model=CropScanResult,
    responses={
        401: {"model": ApiError},
        403: {"model": ApiError},
        404: {"model": ApiError},
    },
)
async def get_scan_detail(
    scan_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full scan prediction and advisory details by scan_id."""
    scan_service = ScanService(db)
    return await scan_service.get_scan_detail(scan_id=scan_id, user_id=current_user.id)
