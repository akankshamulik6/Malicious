# Smart Crop Disease Detection System — Main Backend & Integration Gateway

**Hack2Ignite — Agriculture — AG-01**  
**Member 4**: Main Backend, Database, Authentication, API Gateway, Scan Orchestration, Scan History, Farmer Dashboard APIs.

---

## Architecture Overview

The system follows a microservice architecture where Member 4 serves as the central API gateway and integration boundary between the farmer UI (Member 3), AI ML detection (Member 1), and Agricultural Intelligence Advisory (Member 2).

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

---

## Requirements & Stack

- **Python**: 3.11+
- **Framework**: FastAPI
- **Database**: PostgreSQL (with asyncpg) or SQLite (with aiosqlite for local development/testing)
- **ORM**: SQLAlchemy 2.0 (Async)
- **Migrations**: Alembic
- **HTTP Client**: httpx
- **Testing**: pytest & pytest-asyncio

---

## Local Development Setup

### 1. Install Dependencies
```bash
py -m pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Database Migrations
```bash
py -m alembic upgrade head
```

### 4. Start Mock Services (Optional for standalone testing)
Member 1 AI Service:
```bash
py mock_services/member1_ai_server.py
```

Member 2 Advisory Service:
```bash
py mock_services/member2_advisory_server.py
```

### 5. Start Main Backend Application
```bash
py -m uvicorn app.main:app --reload --port 8000
```

FastAPI Interactive Documentation (Swagger UI) will be available at:
`http://localhost:8000/docs`

---

## Running Test Suite

Run the full automated test suite (Unit, Integration & E2E):
```bash
py -m pytest -v
```

---

## API Summary

All endpoints are versioned under `/api/v1/`:

### Authentication
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET  /api/v1/auth/me`

### Scans & Orchestration
- `POST /api/v1/scans`
- `GET  /api/v1/scans`
- `GET  /api/v1/scans/{scan_id}`

### History & Dashboard
- `GET  /api/v1/history`
- `GET  /api/v1/dashboard/summary`

### Health Check
- `GET  /api/v1/health`

---

## Integration Contracts Document

For comprehensive contract schemas, database mapping tables, and response specifications, refer to [FULL_INTEGRATION_CONTRACT.md](FULL_INTEGRATION_CONTRACT.md).
