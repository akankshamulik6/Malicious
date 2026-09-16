from __future__ import annotations

from app.repositories.disease_repository import DiseaseKnowledgeRepository
from app.schemas.advisory import DiseaseInformation


class DiseaseLookupService:
    """Thin service wrapping the repository. Exists as its own layer so
    lookup strategy (e.g. future synonym tables) can evolve independently
    of both the repository and the advisory engine.

    IMPORTANT: this service performs exact normalized lookups only. It
    never performs fuzzy/similarity matching against the knowledge base -
    an unmatched crop/disease pair must be reported as not found, never
    guessed.
    """

    def __init__(self, repository: DiseaseKnowledgeRepository):
        self._repository = repository

    def lookup(self, crop: str, disease: str) -> DiseaseInformation | None:
        if not crop or not disease:
            return None
        return self._repository.get_disease_information(crop, disease)
