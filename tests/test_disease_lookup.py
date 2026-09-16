from app.services.disease_lookup_service import DiseaseLookupService


def test_known_crop_disease_lookup(repository):
    service = DiseaseLookupService(repository)
    info = service.lookup("Tomato", "Tomato Early Blight")
    assert info is not None
    assert info.crop == "Tomato"
    assert info.disease == "Tomato Early Blight"


def test_unknown_crop_returns_none(repository):
    service = DiseaseLookupService(repository)
    info = service.lookup("Dragonfruit", "Tomato Early Blight")
    assert info is None


def test_unknown_disease_returns_none(repository):
    service = DiseaseLookupService(repository)
    info = service.lookup("Tomato", "Some Nonexistent Disease")
    assert info is None


def test_case_and_whitespace_normalization(repository):
    service = DiseaseLookupService(repository)
    info = service.lookup("  tomato ", "TOMATO EARLY BLIGHT")
    assert info is not None
    assert info.crop == "Tomato"


def test_empty_inputs_return_none(repository):
    service = DiseaseLookupService(repository)
    assert service.lookup("", "Tomato Early Blight") is None
    assert service.lookup("Tomato", "") is None


def test_no_fuzzy_matching_for_similar_but_different_text(repository):
    # A loosely related phrase must never resolve to a real disease
    # record via fuzzy/similarity matching.
    service = DiseaseLookupService(repository)
    info = service.lookup("Tomato", "tomato leaf problem")
    assert info is None


def test_unsupported_disease_for_known_crop_returns_none(repository):
    # Crop is supported, but this particular disease is not in the
    # knowledge base - must be reported as not found, not guessed.
    service = DiseaseLookupService(repository)
    info = service.lookup("Tomato", "Tomato Bacterial Wilt")
    assert info is None


def test_whitespace_only_normalization_not_fuzzy(repository):
    # Only trivial whitespace/case differences are tolerated - not
    # word-order or synonym differences.
    service = DiseaseLookupService(repository)
    assert service.lookup("Tomato", "Early Blight Tomato") is None
