# Member 3 — Farmer Frontend Integration Contract

## Status: M3 — FARMER FRONTEND INTEGRATION READY

### 1. API Endpoint Target
The frontend consumes endpoints hosted by **Member 4 Main Backend**:
- Base Variable: `import.meta.env.VITE_API_BASE_URL`
- Fallback Base URL: `http://localhost:8000`
- Scan Endpoint: `POST /api/v1/scans` (Multipart Form Upload)
- History Endpoint: `GET /api/v1/scans/history`
- Dashboard Endpoint: `GET /api/v1/farmer/dashboard`

### 2. Contract Guarantees & Non-Duplication
- **Contract Ownership:** Member 1 owns AI Predictions. Member 2 owns Agricultural Knowledge. Member 4 owns Backend Persistence. Member 3 strictly presents received data.
- **No Data Fabrication:**
  - If `status === "unknown"`, UI explicitly renders the unknown guidance state.
  - If `explainability.available === false`, heatmap toggle is omitted with explicit notice.
  - If `advisory === null` or `advisory_status === "not_available"`, advisory notice is displayed.
  - If `regional_insight.available === false`, regional intelligence box is omitted.
- **Confidence Values:** Receives confidence floats in `[0.0, 1.0]`. Displays `Math.round(confidence * 100)` to farmers while retaining original precision in application state.
- **Disease Status Standard:** Enforces canonical lowercase enum values: `"healthy" | "diseased" | "unknown"`.
- **Coordinate Scaling:** Bounding box overlay scales `(x1, y1, x2, y2)` relative to rendered HTML DOM image dimensions dynamically during layout recalculations.