import logging
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings
from app.schemas.prediction import PredictionResponse
from app.schemas.location import LocationContext
from app.schemas.advisory import AgriculturalAdvisory

logger = logging.getLogger(__name__)


class Member2AdvisoryClient:
    def __init__(self, base_url: Optional[str] = None, timeout_seconds: Optional[int] = None):
        self.base_url = (base_url or settings.ADVISORY_SERVICE_URL).rstrip("/")
        self.timeout_seconds = timeout_seconds or settings.ADVISORY_SERVICE_TIMEOUT_SECONDS

    async def get_advisory(
        self,
        prediction: PredictionResponse,
        location: Optional[LocationContext] = None,
    ) -> Optional[AgriculturalAdvisory]:
        """Send prediction and location to Member 2 Advisory Service."""
        url = f"{self.base_url}/api/v1/advisory"

        if location is None:
            location = LocationContext()

        payload = {
            "prediction": prediction.model_dump(mode="json"),
            "location": location.model_dump(mode="json"),
        }

        try:
            async with httpx.AsyncClient(timeout=float(self.timeout_seconds)) as client:
                response = await client.post(url, json=payload)

            if response.status_code != 200:
                logger.warning(
                    f"Member 2 Advisory service returned HTTP {response.status_code} for scan_id={prediction.scan_id}"
                )
                return None

            res_json = response.json()
            advisory = AgriculturalAdvisory.model_validate(res_json)
            return advisory

        except (httpx.TimeoutException, httpx.ConnectError) as exc:
            logger.warning(f"Member 2 Advisory client network error for scan_id={prediction.scan_id}: {exc}")
            return None
        except Exception as exc:
            logger.error(f"Failed to process Member 2 advisory response for scan_id={prediction.scan_id}: {exc}")
            return None

    async def get_health(self) -> Dict[str, Any]:
        """Check Member 2 Advisory service health."""
        url = f"{self.base_url}/api/v1/health"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(url)
                return res.json() if res.status_code == 200 else {"status": "unhealthy"}
        except Exception as exc:
            logger.warning(f"Member 2 health check failed: {exc}")
            return {"status": "unreachable"}
