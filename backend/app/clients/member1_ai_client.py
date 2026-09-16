import logging
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings
from app.schemas.prediction import PredictionResponse
from app.core.exceptions import AIServiceUnavailableException, InvalidImageException

logger = logging.getLogger(__name__)


class Member1AIClient:
    def __init__(self, base_url: Optional[str] = None, timeout_seconds: Optional[int] = None):
        self.base_url = (base_url or settings.AI_SERVICE_URL).rstrip("/")
        self.timeout_seconds = timeout_seconds or settings.AI_SERVICE_TIMEOUT_SECONDS

    async def predict(self, scan_id: str, image_bytes: bytes, filename: str = "crop_image.jpg") -> PredictionResponse:
        """Send image and scan_id to Member 1 AI Service and parse PredictionResponse."""
        url = f"{self.base_url}/api/v1/predict"
        data = {"scan_id": scan_id}
        files = {"image": (filename, image_bytes, "image/jpeg")}

        try:
            async with httpx.AsyncClient(timeout=float(self.timeout_seconds)) as client:
                response = await client.post(url, data=data, files=files)

            if response.status_code == 503:
                logger.warning(f"Member 1 AI service returned 503 for scan_id={scan_id}")
                raise AIServiceUnavailableException("Crop analysis is temporarily unavailable. Please try again later.")

            if response.status_code == 400:
                error_detail = response.json() if response.headers.get("content-type") == "application/json" else {}
                msg = error_detail.get("message", "Invalid image submitted to AI model.")
                raise InvalidImageException(msg)

            response.raise_for_status()
            res_json = response.json()
            return PredictionResponse.model_validate(res_json)

        except (httpx.TimeoutException, httpx.ConnectError) as exc:
            logger.error(f"Member 1 AI client network error for scan_id={scan_id}: {exc}")
            raise AIServiceUnavailableException("Crop analysis is temporarily unavailable. Please try again later.")
        except Exception as exc:
            if isinstance(exc, (AIServiceUnavailableException, InvalidImageException)):
                raise exc
            logger.error(f"Failed to process Member 1 prediction response for scan_id={scan_id}: {exc}")
            raise AIServiceUnavailableException("Failed to analyze crop image due to AI service error.")

    async def get_health(self) -> Dict[str, Any]:
        """Check Member 1 AI service health."""
        url = f"{self.base_url}/api/v1/health"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(url)
                return res.json() if res.status_code == 200 else {"status": "unhealthy"}
        except Exception as exc:
            logger.warning(f"Member 1 health check failed: {exc}")
            return {"status": "unreachable"}
