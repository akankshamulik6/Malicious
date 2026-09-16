from fastapi import APIRouter, Depends
from app.api.v1.auth import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.error import ApiError

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserResponse,
    responses={401: {"model": ApiError}},
)
async def get_user_profile(
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve farmer profile information."""
    return current_user
