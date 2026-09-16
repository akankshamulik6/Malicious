from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.prediction_service import predict_image


router = APIRouter(prefix="/api/v1", tags=["AI Prediction"])



@router.get("/model-info")
def model_info():
    return {
        "model_name": "EfficientNetV2-S",
        "model_version": "BiernyVR/crop-disease-classifier",
        "input_size": "224x224",
        "classes": 38,
        "framework": "ONNX Runtime",
    }


@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="Empty image file",
            )

        result = predict_image(image_bytes)

        return result

    except RuntimeError as exc:
        if str(exc) == "MODEL_NOT_AVAILABLE":
            raise HTTPException(
                status_code=503,
                detail={
                    "error_code": "MODEL_NOT_AVAILABLE",
                    "message": "Crop disease model is unavailable.",
                },
            )

        raise

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": "INVALID_IMAGE",
                "message": f"Unable to process image: {exc}",
            },
        )
