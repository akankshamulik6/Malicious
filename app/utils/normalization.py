"""
DiseaseNameNormalizer

Deliberately simple and explicit: we normalize whitespace/case for the
purpose of *key lookup only*. We never fuzzy-match a disease name to a
different disease. If a normalized key isn't found, the caller must
treat it as "not found" -- never guess the closest match.
"""
from __future__ import annotations


def normalize_key(value: str) -> str:
    """Collapse whitespace and lowercase a string for use as a dict key.

    This does NOT attempt spelling correction or fuzzy similarity - it
    only accounts for trivial formatting differences (extra spaces,
    inconsistent casing) between Member 1's raw string output and the
    knowledge base entries.
    """
    return " ".join(value.strip().lower().split())


def make_lookup_key(crop: str, disease: str) -> str:
    """Build the canonical composite lookup key for a crop+disease pair."""
    return f"{normalize_key(crop)}::{normalize_key(disease)}"
