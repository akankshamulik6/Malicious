from __future__ import annotations

import os
from pathlib import Path


class Settings:
    """Minimal application settings, overridable via environment variables."""

    APP_NAME: str = "Agricultural Intelligence & Disease Advisory Module"
    API_PREFIX: str = "/api/v1"

    # Path to the disease knowledge JSON file. Member 4 can later swap the
    # repository implementation for a database-backed one without changing
    # this config surface.
    DISEASE_KNOWLEDGE_PATH: Path = Path(
        os.getenv(
            "DISEASE_KNOWLEDGE_PATH",
            str(Path(__file__).resolve().parent.parent.parent / "data" / "disease_knowledge.json"),
        )
    )

    LOW_CONFIDENCE_THRESHOLD: float = float(os.getenv("LOW_CONFIDENCE_THRESHOLD", "0.5"))


settings = Settings()
