# Agricultural Integration Contract — Member 2

This document is the integration handoff for Members 1, 3, and 4.
**Public API surface is frozen** as of this revision (see §20).

## 1. Member 1 input contract (`PredictionResponse`)

These field names, types, and enum values are **LOCKED** and must never
be renamed or reinterpreted by Member 2. All fields below are
**required** — Member 2 validates strictly against this canonical
shape rather than silently accepting partial payloads.

| Field | Type | Notes |
|---|---|---|
| `scan_id` | string | |
| `crop` | string | |
| `disease` | string | `"unknown"` when unidentified |
| `status` | string enum | `healthy` \| `diseased` \| `unknown` |
| `confidence` | float | `0.0`–`1.0` inclusive (e.g. `0.94`, never `94`) |
| `model_name` | string | |
| `model_version` | string | |
| `processing_time_ms` | integer | |
| `explainability` | object | `{method, available, heatmap_url}` — `method` and `available` required |
| `detections` | array | list of `{class_name, confidence, bounding_box}`; `bounding_box` is `{x1,y1,x2,y2}` or `null` |

```json
{
  "scan_id": "scan_123456",
  "crop": "Tomato",
  "disease": "Tomato Early Blight",
  "status": "diseased",
  "confidence": 0.94,
  "model_name": "crop_disease_classifier",
  "model_version": "1.0.0",
  "processing_time_ms": 842,
  "explainability": {"method": "grad_cam", "available": true, "heatmap_url": null},
  "detections": []
}
```

**Confidence semantics:** confidence is always represented as a float
from `0.0` to `1.0` inclusive (e.g. `0.94` = 94% model certainty).
Member 2 never rescales, rounds, or reinterprets this value, and never
accepts a bare percentage (e.g. `94`) in its place — out-of-range or
percentage-shaped values are rejected with `INVALID_PREDICTION` (§6).

If a future Member 1 build needs to omit some of this metadata, that
should be handled through an explicit adapter at the integration
boundary rather than by silently weakening this contract.

## 2. Agricultural Advisory request (`POST /api/v1/advisory`)

```json
{
  "prediction": { "...": "PredictionResponse, as above" },
  "location": {
    "country": "India",
    "state": "Maharashtra",
    "district": "Pune",
    "latitude": null,
    "longitude": null
  }
}
```

`location` is optional; every field within it is optional.

## 3. Agricultural Advisory response (`AgriculturalAdvisory`)

```json
{
  "scan_id": "scan_123456",
  "crop": "Tomato",
  "disease": "Tomato Early Blight",
  "status": "diseased",
  "confidence": 0.94,
  "description": "Early blight is one of the most common tomato diseases...",
  "symptoms": ["..."],
  "possible_causes": ["..."],
  "severity": "moderate",
  "management_practices": ["..."],
  "preventive_measures": ["..."],
  "regional_insight": {
    "available": false,
    "region": "Pune",
    "trend": null,
    "source": null,
    "observed_period": null
  },
  "advisory_status": "ready",
  "disclaimer": "This result is AI-generated and should be used as general guidance..."
}
```

`scan_id`, `crop`, `disease`, `status`, `confidence` are always passed
through unmodified from the request's `prediction` object. This is
enforced by explicit tests (`tests/test_advisory.py`,
`tests/test_member1_integration.py`) that assert:

```python
assert advisory.scan_id == prediction.scan_id
assert advisory.crop == prediction.crop
assert advisory.disease == prediction.disease
assert advisory.status == prediction.status
assert advisory.confidence == prediction.confidence
```

## 4. Disease knowledge schema (`DiseaseInformation`)

```python
class DiseaseInformation(BaseModel):
    crop: str
    disease: str
    description: str
    symptoms: list[str]
    possible_causes: list[str]
    severity: Severity              # see §7
    management_practices: list[str]
    preventive_measures: list[str]
    source: str | None
    source_url: str | None
    last_verified: str | None       # e.g. "2024"
```

## 5. Location schema (`LocationContext`)

```python
class LocationContext(BaseModel):
    country: str | None = None
    state: str | None = None
    district: str | None = None
    latitude: float | None = None   # -90..90
    longitude: float | None = None  # -180..180
```

## 6. Regional trend enum (`RegionalTrend`)

```python
class RegionalTrend(str, Enum):
    INCREASING = "increasing"
    DECREASING = "decreasing"
    STABLE = "stable"
    UNKNOWN = "unknown"
```

`RegionalInsight`:

```python
class RegionalInsight(BaseModel):
    available: bool
    region: str | None = None
    trend: RegionalTrend | None = None
    source: str | None = None
    observed_period: str | None = None
```

No source of real regional trend data is currently wired in, so
`regional_insight.available` is always `false` today; `trend` /
`source` / `observed_period` are only ever populated from a real,
documented source, never fabricated.

## 7. Severity enum (`Severity`)

```python
class Severity(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    UNKNOWN = "unknown"
```

Severity is an agricultural-knowledge attribute (disease impact/risk)
and is **never** derived from AI prediction `confidence` (model
certainty) — these are unrelated concepts. Severity always comes from
the matched `DiseaseInformation` record, or defaults to `unknown` when
no record matches or when status is `healthy`/`unknown`.

## 8. Advisory status enum (`AdvisoryStatus`)

```python
class AdvisoryStatus(str, Enum):
    READY = "ready"
    REQUIRES_REVIEW = "requires_review"
    NOT_AVAILABLE = "not_available"
```

- `ready` — agricultural information was found and returned.
- `requires_review` — prediction status is `unknown`, disease is
  `"unknown"`, or confidence is below the low-confidence threshold.
- `not_available` — a valid `diseased` prediction had no matching
  knowledge-base record.

## 9. Error codes

| Code | HTTP | Meaning |
|---|---|---|
| `INVALID_PREDICTION` | 422 | The `prediction` object failed schema validation (e.g. confidence out of range, invalid status, missing required field, or missing entirely) |
| `INVALID_LOCATION` | 422 | The `location` object failed schema validation (e.g. latitude/longitude out of range) |
| `DISEASE_NOT_FOUND` | 404 | `GET /diseases/{crop}/{disease}` had no matching record |
| `ADVISORY_NOT_AVAILABLE` | 200* | Advisory built successfully but `advisory_status = not_available` |
| `REGIONAL_DATA_UNAVAILABLE` | 200* | `regional_insight.available = false` — reserved for future use if a live regional data source is integrated and that call fails |
| `INVALID_REQUEST` | 422 | General request-shape validation failure not attributable to `prediction` or `location` specifically (e.g. malformed JSON body) |
| `INTERNAL_ERROR` | 500 | Unexpected server-side failure |

\* `ADVISORY_NOT_AVAILABLE` and `REGIONAL_DATA_UNAVAILABLE` are
represented as normal `200` responses with status flags (`advisory_status`
/ `regional_insight.available`) rather than HTTP errors, since a
"no data" advisory is still a valid, deliverable response to the
farmer. They are documented here as canonical codes for completeness
and for any client that wants to branch on them from the response body.

Example error body:

```json
{
  "error_code": "INVALID_PREDICTION",
  "message": "The submitted prediction did not match the required Member 1 contract.",
  "details": ["... pydantic error detail ..."]
}
```

Validation errors are classified by which part of the request body
failed: an error under `prediction` → `INVALID_PREDICTION`, under
`location` → `INVALID_LOCATION`, otherwise → `INVALID_REQUEST`.

## 10. API endpoints (frozen)

- `GET /api/v1/health` — liveness check.
- `POST /api/v1/advisory` — build an advisory from a `PredictionResponse` (+ optional location).
- `GET /api/v1/diseases/{crop}/{disease}` — fetch a raw `DiseaseInformation` record.

These three endpoints are frozen. Do not rename, remove, or version
them (e.g. `/api/v2/`) without explicit team agreement.

## 11–12. Example requests and responses

See §2–3 above, plus `tests/test_api.py` and
`tests/test_member1_integration.py` for further worked examples
(unknown prediction, healthy prediction, not-available disease,
invalid prediction/location).

## 13. Unknown prediction behavior

If `status = "unknown"` (or `disease = "unknown"`), or confidence falls
below the configured low-confidence threshold (default `0.5`, see
`.env.example`), Member 2 returns `advisory_status = "requires_review"`
with no disease-specific content. It never guesses a disease via fuzzy
matching — lookup normalization is limited to trimming whitespace and
case-folding, never similarity/fuzzy matching.

## 14. Unsupported / missing disease behavior

If Member 1 returns a valid `diseased` prediction for a crop/disease
pair with no matching record in the knowledge base, Member 2 returns
`advisory_status = "not_available"` with `description` set to an
explanatory string, `severity = "unknown"`, and all list fields empty —
it never fabricates agricultural information.

## 15. Regional data behavior

Location is used only for context. It never changes the identified
disease — `disease`/`crop` are always taken from the prediction, never
from location-based inference. Regional trend statistics are only ever
populated from a real, documented data source; since none is wired in
yet, `regional_insight.available` is always `false` when insight is
returned (and `regional_insight` is `null` when no location context is
given at all).

## 16. Member 3 integration

Member 3 (frontend) consumes the `AgriculturalAdvisory` object exactly
as returned — it does not need to know how disease information is
stored, how lookup works, how severity is determined, or how regional
data is retrieved. Member 3 must not modify `crop`, `disease`,
`status`, or `confidence`. The UI may format `confidence` for display
(e.g. `0.94` → `"94%"`) but must not alter the stored value it
received.

Display fields available: `crop`, `disease`, `status`, `confidence`,
`description`, `symptoms`, `possible_causes`, `severity`,
`management_practices`, `preventive_measures`, `regional_insight`,
`advisory_status`, `disclaimer`.

## 17. Member 4 integration

Member 4 (backend/DB) calls `POST /api/v1/advisory` with Member 1's
prediction (and any location it has), and can persist:
`scan_id`, `crop`, `disease`, `status`, `confidence`, `severity`,
`advisory_status`, and optionally the full advisory JSON. Member 4 does
not need to understand the internal `DiseaseKnowledgeRepository`
implementation, and can call this service as an internal HTTP service
or proxy these three endpoints through its own API gateway.

## 18. Confidence semantics (recap)

Confidence is represented from `0.0` to `1.0` inclusive, always as a
float, at every layer of this module (Member 1 payload, internal
processing, and `AgriculturalAdvisory` response). It is never rescaled
to a `0`–`100` integer, never rounded, and never used to derive
severity.

## 19. Agricultural knowledge sources

Every disease record in `data/disease_knowledge.json` carries `source`,
`source_url`, and `last_verified` metadata. Current sources are
University of Minnesota Extension pages, fetched and verified live
during this revision (see README §Knowledge base for the specific
URLs). No source or URL in this dataset is fabricated; where a
verified authoritative source was not available for a claim, that
claim was not added.

## 20. Contract freeze statement

As of this revision:
- The three public endpoints (§10) are frozen.
- The `PredictionResponse` field names, types, and enum values (§1) are
  frozen and match Member 1's canonical contract exactly.
- The `AgriculturalAdvisory` response shape (§3) and its `Severity` /
  `AdvisoryStatus` / `RegionalTrend` enums (§6–8) are frozen.
- The error code table (§9) is frozen.

Any further change to these surfaces requires explicit sign-off from
all four team members, since Members 1, 3, and 4 integrate directly
against this contract.
