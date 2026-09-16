import time
import uuid

import numpy as np

from app.ml.model import model
from app.ml.preprocessing import preprocess_image
from app.schemas.prediction import (
    DiseaseStatus,
    ExplainabilityResult,
    PredictionResponse,
)


CONFIDENCE_THRESHOLD = 0.60


def softmax(logits: np.ndarray) -> np.ndarray:
    exp_logits = np.exp(logits - np.max(logits))
    return exp_logits / np.sum(exp_logits)


def parse_class_name(class_name: str) -> tuple[str, str]:
    parts = class_name.split("___", 1)

    if len(parts) != 2:
        return class_name, "unknown"

    crop = parts[0]
    disease = parts[1]

    crop = crop.replace("_", " ").strip()
    disease = disease.replace("_", " ").strip()

    if crop == "Corn (maize)":
        crop = "Maize"

    if disease.lower() == "healthy":
        disease = "healthy"

    return crop, disease


def predict_image(image_bytes: bytes) -> PredictionResponse:
    start_time = time.perf_counter()

    if not model.model_available:
        raise RuntimeError("MODEL_NOT_AVAILABLE")

    tensor = preprocess_image(image_bytes)

    logits = model.predict(tensor)
    probabilities = softmax(logits)

    index = int(np.argmax(probabilities))
    confidence = float(probabilities[index])

    crop, disease = parse_class_name(model.classes[index])

    if confidence < CONFIDENCE_THRESHOLD:
        crop = "unknown"
        disease = "unknown"
        status = DiseaseStatus.UNKNOWN
    elif disease == "healthy":
        status = DiseaseStatus.HEALTHY
    else:
        status = DiseaseStatus.DISEASED

    processing_time_ms = int(
    round((time.perf_counter() - start_time) * 1000)
)

    return PredictionResponse(
        scan_id=str(uuid.uuid4()),
        crop=crop,
        disease=disease,
        status=status,
        confidence=confidence,
        model_name="EfficientNetV2-S",
        model_version="BiernyVR/crop-disease-classifier",
        processing_time_ms=processing_time_ms,
        explainability=ExplainabilityResult(
            method="grad-cam",
            available=False,
            heatmap_url=None,
        ),
        detections=[],
    )
