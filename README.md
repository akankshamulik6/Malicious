# Agricultural Intelligence & Disease Advisory Module

Member 2 module for **Hack2Ignite — Agriculture (AG-01)**.

Converts Member 1's AI disease prediction, combined with agricultural
knowledge and optional farmer location, into a farmer-friendly
**Agricultural Advisory**. This module does **not** train, retrain, or
override the AI model — it only interprets Member 1's canonical
`PredictionResponse`.

## Project purpose

Member 2 sits between the AI/ML disease classifier (Member 1) and the
rest of the system (Member 4's backend, Member 3's frontend). It turns
a raw model prediction into something a farmer can actually act on:
disease description, symptoms, causes, severity, management guidance,
preventive measures, and — where real data exists — regional context.

## Architecture

```
Member 1 (AI/ML)
      ↓  PredictionResponse
Member 2 (this module) — Agricultural Intelligence
      ↓  AgriculturalAdvisory
Member 4 (Main Backend / Database)
      ↓
Member 3 (Farmer Frontend)
```

```
app/
├── main.py                  FastAPI app, global error handling
├── api/advisory.py          HTTP endpoints
├── core/
│   ├── config.py            Settings (knowledge file path, thresholds)
│   └── errors.py            Canonical error codes + classification
├── schemas/
│   ├── prediction.py        Member 1 contract (LOCKED field names, strict validation)
│   ├── location.py          LocationContext, RegionalTrend, RegionalInsight
│   └── advisory.py          Severity, AdvisoryStatus, DiseaseInformation, AgriculturalAdvisory
├── services/
│   ├── advisory_service.py       Core advisory engine
│   ├── disease_lookup_service.py Lookup against the knowledge repository
│   └── regional_insight_service.py Regional context (never fabricated)
├── repositories/
│   └── disease_repository.py     JSON-backed knowledge repository (swappable)
└── utils/normalization.py   Exact, non-fuzzy key normalization
data/disease_knowledge.json  Disease knowledge base, with source metadata
tests/                       70 tests across prediction, advisory, lookup,
                              severity, location, regional insight, API, and
                              an explicit Member 1 integration test
```

## Setup

Requires **Python 3.11+** (uses `X | Y` union type syntax).

```bash
cd agricultural-intelligence
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # optional, defaults work out of the box
uvicorn app.main:app --reload --port 8000
```

Interactive API docs (Swagger UI): `http://localhost:8000/docs`

Run tests:

```bash
pytest
```

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `DISEASE_KNOWLEDGE_PATH` | `data/disease_knowledge.json` | Path to the knowledge base file |
| `LOW_CONFIDENCE_THRESHOLD` | `0.5` | Confidence below this triggers `advisory_status = requires_review` |

No secrets, API keys, or tokens are required by this module; none are
committed to the repository.

## Design rules this module enforces

- **Never modifies** `scan_id`, `crop`, `disease`, `status`, or
  `confidence` received from Member 1 — verified by explicit
  passthrough tests for every advisory path (diseased, healthy,
  unknown, not-available).
- **Confidence is always a `0.0`–`1.0` float.** A bare percentage
  (e.g. `94` instead of `0.94`) is rejected as `INVALID_PREDICTION`,
  never silently coerced.
- **Severity is never derived from confidence** — they are unrelated
  concepts (model certainty vs. disease impact). Enforced by a
  dedicated test comparing the same disease at very different
  confidence levels.
- **`unknown` status** → `advisory_status: requires_review`, no
  disease-specific content, no fuzzy-matched guess.
- **`healthy` status** → preventive/monitoring guidance only, never
  disease treatment.
- **`diseased` status with no matching knowledge** →
  `advisory_status: not_available`, empty fields, no fabricated content.
- **Location never overrides the AI-identified disease.** It only adds
  optional regional context.
- **No fabricated regional statistics.** `regional_insight.available`
  is `false` unless a real, documented data source is wired in.
- **Disease lookup is exact-normalized only** (case/whitespace), never
  fuzzy/similarity-based — an unmatched pair is "not found," never a
  guess (explicitly tested against near-miss phrasing like
  `"tomato leaf problem"`).
- **Severity, status, advisory status, and regional trend are all
  strict enums** — arbitrary strings like `"Critical"` or `"infected"`
  are rejected by schema validation, not silently accepted.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/health` | Liveness check |
| POST | `/api/v1/advisory` | Build an advisory from a prediction (+ optional location) |
| GET | `/api/v1/diseases/{crop}/{disease}` | Look up a raw knowledge record |

These three endpoints are **frozen** — see
`AGRICULTURAL_INTEGRATION_CONTRACT.md` for the full request/response
schemas, enums, error codes, and integration instructions for Member 1,
3, and 4.

## Knowledge base

- **Supported crops:** 3 (Tomato, Potato, Maize)
- **Supported diseases:** 4 (Tomato Early Blight, Tomato Late Blight,
  Potato Late Blight, Maize Common Rust)
- **Schema:** `DiseaseInformation` — crop, disease, description,
  symptoms, possible_causes, `Severity` enum, management_practices,
  preventive_measures, source, source_url, last_verified
- **Data source strategy:** every record's `source`/`source_url` was
  verified by fetching the live page during this revision, not
  fabricated. Current sources:
  - Tomato Early Blight — [University of Minnesota Extension](https://extension.umn.edu/agriculture/specialty-crops/vegetable-farming/disease-management/early-blight-in-tomato-and-potato) (reviewed 2024)
  - Tomato Late Blight / Potato Late Blight — [University of Minnesota Extension](https://extension.umn.edu/disease-management/late-blight) (reviewed 2021)
  - Maize Common Rust — [University of Minnesota Extension](https://extension.umn.edu/corn-pest-management/common-rust-corn) (reviewed 2018)

  This is still a small, illustrative hackathon dataset (4 records) —
  expand it with more verified extension/ICAR/USDA sources before any
  production use, following the same schema and verification approach.

The `DiseaseKnowledgeRepository` interface means Member 4 can later
back this with PostgreSQL/Supabase without changing the advisory logic
— only a new repository implementation is needed.

## Safety

- **AI uncertainty:** every advisory carries a disclaimer that the
  result is AI-generated general guidance and recommends consulting a
  qualified agricultural expert for serious or uncertain cases.
- **Unsupported disease handling:** never fabricated — returns
  `advisory_status = not_available` with empty/`unknown` fields.
- **No fabricated regional data:** `regional_insight.available` is
  only ever `true` when backed by a real, documented data source
  (none is currently wired in, so it is always `false` today).
- **No pesticide dosages or chemical schedules** are included;
  management guidance stays general and defers to local agricultural
  experts.
- **Location privacy:** farmer coordinates are used only to compute
  the requested regional context for that single request and are not
  persisted or logged by this module.

## Testing

`pytest` — **70 tests**:

- `test_prediction.py` (13) — schema validation: valid/healthy/diseased/unknown
  predictions, confidence bounds (0.0, 1.0, below 0, above 1, percentage-shaped),
  invalid status, missing required fields, confidence never rescaled
- `test_severity.py` (6) — all four severity levels, default, rejection of
  arbitrary values
- `test_disease_lookup.py` (8) — known/unknown crop/disease, case and
  whitespace normalization, explicit no-fuzzy-matching checks
- `test_regional_insight.py` (5) — missing location, no-region location,
  region present but unavailable, controlled trend vocabulary
- `test_location.py` (7) — country/state/district-only, valid/invalid
  lat/lon, fully optional
- `test_advisory.py` (16) — every advisory path (ready/requires_review/
  not_available), explicit Member 1 field-passthrough assertions for
  each path, severity-independent-of-confidence
- `test_api.py` (13) — all three endpoints, canonical error codes
  (`INVALID_PREDICTION`, `INVALID_LOCATION`, `INVALID_REQUEST`,
  `DISEASE_NOT_FOUND`), case-normalized disease lookup
- `test_member1_integration.py` (2) — explicit end-to-end test using
  the exact canonical Member 1 payload from the integration brief

No lint/format tooling (ruff/black) was previously configured for this
project, so none was introduced for this revision; imports and dead
code were reviewed manually.

## Integration

- **Member 1 → Member 2:** Member 1 calls (or Member 4 forwards)
  `POST /api/v1/advisory` with its `PredictionResponse`. Field names,
  types, and enum values are validated strictly against the locked
  contract.
- **Member 2 → Member 3:** the frontend renders the returned
  `AgriculturalAdvisory` directly — no knowledge of internal lookup,
  severity, or regional logic required.
- **Member 2 → Member 4:** the backend persists the advisory (or select
  fields from it) alongside the scan record, without needing to know
  the repository's internal implementation.

See `AGRICULTURAL_INTEGRATION_CONTRACT.md` for full schemas and
worked examples.
