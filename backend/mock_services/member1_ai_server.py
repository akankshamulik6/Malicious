import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI(title="Member 1 — AI/ML Crop Disease Detection Service", version="1.0.0")


class ExplainabilityResult(BaseModel):
    method: str
    available: bool
    heatmap_url: Optional[str] = None


class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class DetectionResult(BaseModel):
    class_name: str
    confidence: float
    bounding_box: Optional[BoundingBox] = None


class PredictionResponse(BaseModel):
    scan_id: str
    crop: str
    disease: str
    status: str  # "healthy", "diseased", "unknown"
    confidence: float  # float 0.0 -> 1.0
    model_name: str
    model_version: str
    processing_time_ms: int
    explainability: ExplainabilityResult
    detections: List[DetectionResult] = []


@app.get("/api/v1/health")
async def health():
    return {"status": "ok", "service": "member1-ai-detection", "version": "1.0.0"}


@app.get("/api/v1/model-info")
async def model_info():
    return {
        "model_name": "crop_disease_classifier",
        "model_version": "1.0.0",
        "supported_crops": ["Tomato", "Potato", "Corn", "Wheat"],
    }


@app.post("/api/v1/predict", response_model=PredictionResponse)
async def predict(
    scan_id: str = Form(...),
    image: UploadFile = File(...),
):
    if not image:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": "INVALID_IMAGE", "message": "No image provided"},
        )

    filename = image.filename or ""

    # Simulated trigger responses based on filename triggers for testing
    if "unavailable" in filename.lower() or scan_id == "trigger_503":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error_code": "MODEL_NOT_AVAILABLE", "message": "AI model inference engine is offline."},
        )

    if "healthy" in filename.lower():
        return PredictionResponse(
            scan_id=scan_id,
            crop="Tomato",
            disease="Healthy",
            status="healthy",
            confidence=0.98,
            model_name="crop_disease_classifier",
            model_version="1.0.0",
            processing_time_ms=650,
            explainability=ExplainabilityResult(method="grad_cam", available=True, heatmap_url=None),
            detections=[],
        )

    if "unknown" in filename.lower():
        return PredictionResponse(
            scan_id=scan_id,
            crop="Tomato",
            disease="unknown",
            status="unknown",
            confidence=0.32,
            model_name="crop_disease_classifier",
            model_version="1.0.0",
            processing_time_ms=510,
            explainability=ExplainabilityResult(method="grad_cam", available=False, heatmap_url=None),
            detections=[],
        )

    # Default diseased response (Tomato Early Blight)
    return PredictionResponse(
        scan_id=scan_id,
        crop="Tomato",
        disease="Tomato Early Blight",
        status="diseased",
        confidence=0.94,
        model_name="crop_disease_classifier",
        model_version="1.0.0",
        processing_time_ms=842,
        explainability=ExplainabilityResult(method="grad_cam", available=True, heatmap_url=None),
        detections=[
            DetectionResult(
                class_name="Early Blight Spot",
                confidence=0.92,
                bounding_box=BoundingBox(x1=0.2, y1=0.3, x2=0.5, y2=0.6),
            )
        ],
    )

if __name__ == "__main__":
    import os
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8001)))