from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, UserResponse, TokenResponse
from app.schemas.error import ApiError
from app.services.auth_service import AuthService
from app.core.exceptions import UnauthorizedException

router = APIRouter(prefix="/auth", tags=["Authentication"])
security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    if not credentials or not credentials.credentials:
        raise UnauthorizedException("Authentication token is missing.")

    auth_service = AuthService(db)
    return await auth_service.get_user_from_token(credentials.credentials)


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ApiError}},
)
async def register(
    data: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new farmer user account."""
    auth_service = AuthService(db)
    return await auth_service.register_user(data)


@router.post(
    "/login",
    response_model=TokenResponse,
    responses={401: {"model": ApiError}},
)
async def login(
    data: UserLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate farmer user and receive access token."""
    auth_service = AuthService(db)
    return await auth_service.login_user(data)


@router.get(
    "/me",
    response_model=UserResponse,
    responses={401: {"model": ApiError}},
)
async def get_me(
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve details of currently authenticated user."""
    return current_user
