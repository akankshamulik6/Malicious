# FULL INTEGRATION CONTRACT & ARCHITECTURE SPECIFICATION

**System Identifier**: Hack2Ignite — Agriculture — AG-01 (Smart Crop Disease Detection System)  
**Primary Integration Owner**: Member 4 (Main Backend, Database, Authentication & API Orchestration)

---

## 1. System Architecture

The overall system architecture establishes clean boundary separation between components:

```
                         ┌───────────────────────┐
                         │       FARMER          │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │      MEMBER 3         │
                         │   React/TypeScript    │
                         │   Farmer Frontend     │
                         └───────────┬───────────┘
                                     │ HTTPS/REST
                                     ▼
                  ┌────────────────────────────────────┐
                  │          MEMBER 4 BACKEND           │
                  │                                    │
                  │ Authentication                    │
                  │ Scan Orchestration                │
                  │ API Gateway                        │
                  │ Database (PostgreSQL / Async)     │
                  │ Dashboard & History                │
                  │ User Management                    │
                  └─────────────┬──────────┬───────────┘
                                │          │
                         HTTP/REST          │ HTTP/REST
                                │          │
                                ▼          ▼
                     ┌──────────────┐  ┌─────────────────┐
                     │  MEMBER 1    │  │    MEMBER 2     │
                     │ AI/ML        │  │ Agricultural    │
                     │ Detection    │  │ Intelligence    │
                     └──────────────┘  └─────────────────┘
```

### End-to-End Operational Flow
1. **Farmer** uploads crop image on **Member 3 (Frontend)**.
2. **Member 3** calls `POST /api/v1/scans` on **Member 4 (Backend)** with image and location context.
3. **Member 4** authenticates farmer JWT, generates authoritative `scan_id`, creates database record with status `analyzing`.
4. **Member 4** forwards `scan_id` and image binary to **Member 1 (AI Service)** (`POST /api/v1/predict`).
5. **Member 1** performs ML inference and returns `PredictionResponse`.
6. **Member 4** validates and persists prediction in PostgreSQL.
7. **Member 4** forwards prediction & location context to **Member 2 (Advisory Service)** (`POST /api/v1/advisory`).
8. **Member 2** generates agricultural advisory and returns `AgriculturalAdvisory`.
9. **Member 4** validates consistency, persists advisory, marks scan `completed`, and returns `CropScanResult` to **Member 3**.
10. **Member 3** renders scan result, advisory, explainability visualization, and updates dashboard.

---

## 2. Member 1 Contract (LOCKED)

**Base URL**: `AI_SERVICE_URL` (e.g. `http://localhost:8001`)

### Endpoints
- `GET /api/v1/health`
- `GET /api/v1/model-info`
- `POST /api/v1/predict` (`multipart/form-data`)

### Request
```http
POST /api/v1/predict
Content-Type: multipart/form-data

scan_id=<string>
image=<binary>
```

### Response Schema (`PredictionResponse`)
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
  "explainability": {
    "method": "grad_cam",
    "available": true,
    "heatmap_url": null
  },
  "detections": [
    {
      "class_name": "Early Blight Spot",
      "confidence": 0.92,
      "bounding_box": {
        "x1": 0.2,
        "y1": 0.3,
        "x2": 0.5,
        "y2": 0.6
      }
    }
  ]
}
```

---

## 3. Member 2 Contract (LOCKED)

**Base URL**: `ADVISORY_SERVICE_URL` (e.g. `http://localhost:8002`)

### Endpoints
- `GET /api/v1/health`
- `POST /api/v1/advisory` (`application/json`)
- `GET /api/v1/diseases/{crop}/{disease}`

### Request
```json
{
  "prediction": {
    "scan_id": "scan_123456",
    "crop": "Tomato",
    "disease": "Tomato Early Blight",
    "status": "diseased",
    "confidence": 0.94,
    "model_name": "crop_disease_classifier",
    "model_version": "1.0.0",
    "processing_time_ms": 842,
    "explainability": {
      "method": "grad_cam",
      "available": true,
      "heatmap_url": null
    },
    "detections": []
  },
  "location": {
    "country": "India",
    "state": "Maharashtra",
    "district": "Pune",
    "latitude": 18.5204,
    "longitude": 73.8567
  }
}
```

### Response Schema (`AgriculturalAdvisory`)
```json
{
  "scan_id": "scan_123456",
  "crop": "Tomato",
  "disease": "Tomato Early Blight",
  "status": "diseased",
  "confidence": 0.94,
  "description": "Fungal spot infection causing dark spots with concentric rings.",
  "symptoms": [
    "Dark brown concentric ring spots on lower leaves",
    "Yellowing foliage surrounding leaf lesions"
  ],
  "possible_causes": [
    "Alternaria solani fungal spores",
    "Prolonged warm, humid weather conditions"
  ],
  "severity": "moderate",
  "management_practices": [
    "Apply copper-based or chlorothalonil fungicide",
    "Prune and safely destroy heavily infected lower leaves"
  ],
  "preventive_measures": [
    "Rotate crops with non-solanaceous species every 2-3 years",
    "Use drip irrigation instead of overhead sprinklers"
  ],
  "regional_insight": {
    "available": true,
    "region": "Pune, Maharashtra, India",
    "trend": "Increased early blight cases following seasonal rains",
    "source": "Department of Agriculture Extension Services",
    "observed_period": "Q3 2026"
  },
  "advisory_status": "ready"
}
```

---

## 4. Member 3 (Frontend) & Member 4 (Backend) Contract

Member 3 communicates exclusively with Member 4 via `/api/v1/`.

### Aggregated Result Schema (`CropScanResult`)
```json
{
  "prediction": { ... PredictionResponse ... },
  "advisory": { ... AgriculturalAdvisory ... }
}
```

---

## 5. Member 4 Public Endpoints

All endpoints use prefix `/api/v1/`:

### Authentication
- `POST /api/v1/auth/register`: Register user account.
- `POST /api/v1/auth/login`: Authenticate and receive JWT.
- `GET /api/v1/auth/me`: Get current authenticated user details.

### Scans & History
- `POST /api/v1/scans`: Upload crop image (`multipart/form-data`) + location parameters. Returns `CropScanResult`.
- `GET /api/v1/scans`: List user historical scan summaries with pagination (`page`, `page_size`, `status`, `crop`).
- `GET /api/v1/scans/{scan_id}`: Retrieve detailed `CropScanResult` for a specific scan.
- `GET /api/v1/history`: Alias for scan history list.

### Farmer Dashboard
- `GET /api/v1/dashboard/summary`: Retrieve computed dashboard statistics (`total_scans`, `healthy_scans`, `diseased_scans`, `recent_scans`).

### Health Check
- `GET /api/v1/health`: System & dependency health status.

---

## 6. Canonical Enums & Locked Types

- **DiseaseStatus**: `"healthy"`, `"diseased"`, `"unknown"`
- **ScanProcessingStatus**: `"pending"`, `"analyzing"`, `"completed"`, `"failed"`
- **Severity**: `"low"`, `"moderate"`, `"high"`, `"unknown"`
- **AdvisoryStatus**: `"ready"`, `"requires_review"`, `"not_available"`

---

## 7. Database Mapping

| API Schema Field | Database Table & Field | Data Type | Notes |
| :--- | :--- | :--- | :--- |
| `scan_id` | `scans.id` | VARCHAR(36) | Primary Key (UUID) |
| `user_id` | `scans.user_id` | VARCHAR(36) | Foreign Key -> `users.id` |
| `status` | `predictions.status` | VARCHAR(50) | `healthy`, `diseased`, `unknown` |
| `crop` | `predictions.crop` | VARCHAR(100) | Authoritative from Member 1 |
| `disease` | `predictions.disease` | VARCHAR(200) | Authoritative from Member 1 |
| `confidence` | `predictions.confidence` | DOUBLE PRECISION | Float `0.0` -> `1.0` |
| `model_name` | `predictions.model_name` | VARCHAR(100) | ML Model Name |
| `model_version` | `predictions.model_version` | VARCHAR(50) | ML Model Version |
| `processing_time_ms` | `predictions.processing_time_ms` | INTEGER | Inference time in ms |
| `severity` | `advisories.severity` | VARCHAR(50) | `low`, `moderate`, `high`, `unknown` |
| `symptoms` | `advisories.symptoms` | JSON | List of symptom strings |
| `possible_causes` | `advisories.possible_causes` | JSON | List of cause strings |
| `management_practices` | `advisories.management_practices` | JSON | List of practice strings |
| `preventive_measures` | `advisories.preventive_measures` | JSON | List of measure strings |
| `regional_insight` | `advisories.regional_insight` | JSON | Nested regional object |

---

## 8. Canonical Error Codes

Member 4 exposes structured errors matching `ApiError`:
- `INVALID_IMAGE` (400)
- `INVALID_LOCATION` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `SCAN_NOT_FOUND` (404)
- `DATABASE_ERROR` (500)
- `INTERNAL_ERROR` (500)
- `AI_SERVICE_UNAVAILABLE` (503)
- `ADVISORY_SERVICE_UNAVAILABLE` (503)

---

## 9. Environment Variables

```env
APP_NAME=agri-ai-backend
APP_VERSION=1.0.0
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/agri_ai
AI_SERVICE_URL=http://localhost:8001
AI_SERVICE_TIMEOUT_SECONDS=30
ADVISORY_SERVICE_URL=http://localhost:8002
ADVISORY_SERVICE_TIMEOUT_SECONDS=15
JWT_SECRET_KEY=CHANGE_THIS_SECRET_KEY
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
FRONTEND_ORIGINS=http://localhost:5173
LOG_LEVEL=INFO
```
