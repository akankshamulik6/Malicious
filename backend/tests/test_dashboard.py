import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dashboard_empty_initial_state(client: AsyncClient):
    reg = await client.post(
        "/api/v1/auth/register",
        json={"name": "New Farmer", "email": "newfarmer@farm.org", "password": "password123"},
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    dash_res = await client.get("/api/v1/dashboard/summary", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()

    assert dash_data["total_scans"] == 0
    assert dash_data["healthy_scans"] == 0
    assert dash_data["diseased_scans"] == 0
    assert dash_data["recent_scans"] == []
