from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.advisory import router as advisory_router
from app.api.prediction import router as prediction_router
from app.core.config import settings
from app.core.errors import classify_validation_error

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Converts Member 1's AI disease prediction, plus agricultural "
        "knowledge and optional location context, into a farmer-friendly "
        "advisory. Does not train, retrain, or override the AI model."
    ),
    version="1.0.0",
)

app.include_router(advisory_router)
app.include_router(prediction_router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    error_code = classify_validation_error(errors)

    messages = {
        "INVALID_PREDICTION": "The submitted prediction did not match the required Member 1 contract.",
        "INVALID_LOCATION": "The submitted location context is invalid.",
        "INVALID_REQUEST": "The request could not be validated.",
    }

    return JSONResponse(
        status_code=422,
        content={
            "error_code": error_code,
            "message": messages.get(error_code, messages["INVALID_REQUEST"]),
            "details": errors,
        },
    )


@app.get("/")
def root() -> dict:
    return {
        "service": settings.APP_NAME,
        "status": "ok",
        "docs": "/docs",
        "api_prefix": settings.API_PREFIX,
    }
