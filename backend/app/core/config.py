import os
from typing import List, Union
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    APP_NAME: str = "agri-ai-backend"
    APP_VERSION: str = "1.0.0"

    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./agri_ai.db",
        description="SQLAlchemy database connection string. PostgreSQL or SQLite async supported.",
    )

    AI_SERVICE_URL: str = "http://localhost:8001"
    AI_SERVICE_TIMEOUT_SECONDS: int = 30

    ADVISORY_SERVICE_URL: str = "http://localhost:8002"
    ADVISORY_SERVICE_TIMEOUT_SECONDS: int = 15

    JWT_SECRET_KEY: str = "CHANGE_ME_SECRET_KEY_FOR_AGRICULTURE_SYSTEM_2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    FRONTEND_ORIGINS: Union[str, List[str]] = "http://localhost:5173"

    LOG_LEVEL: str = "INFO"

    @property
    def allowed_origins(self) -> List[str]:
        if isinstance(self.FRONTEND_ORIGINS, list):
            return self.FRONTEND_ORIGINS
        if isinstance(self.FRONTEND_ORIGINS, str):
            if self.FRONTEND_ORIGINS.strip() == "*":
                return ["*"]
            return [origin.strip() for origin in self.FRONTEND_ORIGINS.split(",") if origin.strip()]
        return ["http://localhost:5173"]


settings = Settings()
