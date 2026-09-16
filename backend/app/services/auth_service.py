from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, UserResponse, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.core.exceptions import UnauthorizedException, CustomApiException


class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)

    async def register_user(self, data: UserRegisterRequest) -> TokenResponse:
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            raise CustomApiException(
                status_code=400,
                error_code="EMAIL_ALREADY_REGISTERED",
                message="An account with this email address already exists.",
            )

        hashed_pwd = hash_password(data.password)
        user = await self.user_repo.create(
            name=data.name,
            email=data.email,
            password_hash=hashed_pwd,
            language=data.language,
        )

        user_resp = UserResponse.model_validate(user)
        access_token = create_access_token(subject=user.id)
        return TokenResponse(access_token=access_token, user=user_resp)

    async def login_user(self, data: UserLoginRequest) -> TokenResponse:
        user = await self.user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise UnauthorizedException("Invalid email or password.")

        user_resp = UserResponse.model_validate(user)
        access_token = create_access_token(subject=user.id)
        return TokenResponse(access_token=access_token, user=user_resp)

    async def get_user_from_token(self, token: str) -> UserResponse:
        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            raise UnauthorizedException("Invalid or expired authentication token.")

        user_id = payload["sub"]
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UnauthorizedException("User associated with token no longer exists.")

        return UserResponse.model_validate(user)
