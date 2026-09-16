"""
DiseaseKnowledgeRepository

Abstraction over disease knowledge storage. The current implementation
reads from a local JSON file, but the interface is intentionally narrow
so Member 4 can later back it with PostgreSQL/Supabase without touching
the advisory logic above it.
"""
from __future__ import annotations

import json
from pathlib import Path

from app.schemas.advisory import DiseaseInformation
from app.utils.normalization import make_lookup_key


class DiseaseKnowledgeRepository:
    def get_disease_information(self, crop: str, disease: str) -> DiseaseInformation | None:
        raise NotImplementedError

    def list_supported(self) -> list[tuple[str, str]]:
        raise NotImplementedError


class JsonDiseaseKnowledgeRepository(DiseaseKnowledgeRepository):
    """JSON-file-backed implementation of DiseaseKnowledgeRepository."""

    def __init__(self, path: Path):
        self._path = path
        self._by_key: dict[str, DiseaseInformation] = {}
        self._load()

    def _load(self) -> None:
        if not self._path.exists():
            self._by_key = {}
            return

        with open(self._path, "r", encoding="utf-8") as f:
            raw_records = json.load(f)

        by_key: dict[str, DiseaseInformation] = {}
        for raw in raw_records:
            info = DiseaseInformation(**raw)
            key = make_lookup_key(info.crop, info.disease)
            by_key[key] = info
        self._by_key = by_key

    def get_disease_information(self, crop: str, disease: str) -> DiseaseInformation | None:
        key = make_lookup_key(crop, disease)
        return self._by_key.get(key)

    def list_supported(self) -> list[tuple[str, str]]:
        return [(info.crop, info.disease) for info in self._by_key.values()]

    def reload(self) -> None:
        """Reload knowledge from disk. Useful for tests."""
        self._load()
