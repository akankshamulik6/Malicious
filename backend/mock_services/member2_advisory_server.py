import uvicorn
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Literal

app = FastAPI(title="Member 2 — Agricultural Intelligence Service", version="1.0.0")


class LocationContext(BaseModel):
    country: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class RegionalInsight(BaseModel):
    available: bool
    region: Optional[str] = None
    trend: Optional[str] = None
    source: Optional[str] = None
    observed_period: Optional[str] = None


class PredictionResponse(BaseModel):
    scan_id: str
    crop: str
    disease: str
    status: str
    confidence: float
    model_name: str
    model_version: str
    processing_time_ms: int
    explainability: dict
    detections: List[dict] = []


class AdvisoryRequest(BaseModel):
    prediction: PredictionResponse
    location: Optional[LocationContext] = None


class AgriculturalAdvisory(BaseModel):
    scan_id: str
    crop: str
    disease: str
    status: str
    confidence: float
    description: Optional[str] = None
    symptoms: List[str] = []
    possible_causes: List[str] = []
    severity: Literal["low", "moderate", "high", "unknown"]
    management_practices: List[str] = []
    preventive_measures: List[str] = []
    regional_insight: Optional[RegionalInsight] = None
    advisory_status: Literal["ready", "requires_review", "not_available"]


@app.get("/api/v1/health")
async def health():
    return {"status": "ok", "service": "member2-agricultural-intelligence", "version": "1.0.0"}


@app.get("/api/v1/diseases/{crop}/{disease}")
async def get_disease_info(crop: str, disease: str):
    return {
        "crop": crop,
        "disease": disease,
        "info": f"Agricultural guidance reference for {crop} - {disease}.",
    }


@app.post("/api/v1/advisory", response_model=AgriculturalAdvisory)
async def get_advisory(req: AdvisoryRequest):
    pred = req.prediction
    loc = req.location

    if pred.scan_id == "trigger_503":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Advisory service temporarily unavailable",
        )

    region_str = None
    if loc and (loc.state or loc.country):
        parts = [p for p in [loc.district, loc.state, loc.country] if p]
        region_str = ", ".join(parts)

    if pred.status == "healthy":
        return AgriculturalAdvisory(
            scan_id=pred.scan_id,
            crop=pred.crop,
            disease=pred.disease,
            status=pred.status,
            confidence=pred.confidence,
            description="The crop foliage appears healthy with no visible signs of pathogen infection.",
            symptoms=[],
            possible_causes=[],
            severity="low",
            management_practices=["Maintain balanced N-P-K fertilization", "Regular crop monitoring"],
            preventive_measures=["Practice crop rotation", "Ensure proper field drainage"],
            regional_insight=RegionalInsight(
                available=True if region_str else False,
                region=region_str,
                trend="Healthy crops reported across region",
                source="Agricultural Intelligence Network",
                observed_period="Q3 2026",
            ),
            advisory_status="ready",
        )

    if pred.status == "unknown":
        return AgriculturalAdvisory(
            scan_id=pred.scan_id,
            crop=pred.crop,
            disease=pred.disease,
            status=pred.status,
            confidence=pred.confidence,
            description="Crop condition could not be conclusively identified by the AI model. Expert review recommended.",
            symptoms=["Uncertain symptoms requiring visual inspection"],
            possible_causes=["Atypical presentation or multi-pathogen interaction"],
            severity="unknown",
            management_practices=["Consult local agricultural extension officer"],
            preventive_measures=["Isolate affected plant samples for laboratory testing"],
            regional_insight=None,
            advisory_status="requires_review",
        )

    # Default diseased response
    return AgriculturalAdvisory(
        scan_id=pred.scan_id,
        crop=pred.crop,
        disease=pred.disease,
        status=pred.status,
        confidence=pred.confidence,
        description="Fungal infection caused by Alternaria solani leading to target-pattern spots on lower leaves.",
        symptoms=[
            "Dark brown concentric ring spots on lower leaves",
            "Yellowing foliage surrounding leaf lesions",
            "Premature leaf drop in severe cases",
        ],
        possible_causes=[
            "Alternaria solani fungal spores",
            "Prolonged warm, humid weather conditions",
            "Nutrient deficiency stress",
        ],
        severity="moderate",
        management_practices=[
            "Apply registered copper-based or chlorothalonil fungicide",
            "Prune and safely destroy heavily infected lower leaves",
            "Ensure proper row spacing to maximize airflow",
        ],
        preventive_measures=[
            "Rotate crops with non-solanaceous species every 2-3 years",
            "Use drip irrigation instead of overhead sprinklers",
            "Mulch soil to prevent splash dispersal of soilborne spores",
        ],
        regional_insight=RegionalInsight(
            available=True if region_str else False,
            region=region_str or "Western Region",
            trend="Increased early blight cases following seasonal rains",
            source="Department of Agriculture Extension Services",
            observed_period="Q3 2026",
        ),
        advisory_status="ready",
    )


if __name__ == "__main__":
    import os
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8002)))