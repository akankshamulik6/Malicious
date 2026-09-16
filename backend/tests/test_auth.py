import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_and_login_flow(client: AsyncClient):
    # 1. Register a new user
    register_payload = {
        "name": "Ramesh Kumar",
        "email": "ramesh@farm.org",
        "password": "securepassword123",
        "language": "hi",
    }
    reg_response = await client.post("/api/v1/auth/register", json=register_payload)
    assert reg_response.status_code == 201
    reg_data = reg_response.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "ramesh@farm.org"
    assert reg_data["user"]["language"] == "hi"

    token = reg_data["access_token"]

    # 2. Get current user profile (/me)
    me_response = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == "ramesh@farm.org"

    # 3. Login with correct credentials
    login_payload = {
        "email": "ramesh@farm.org",
        "password": "securepassword123",
    }
    login_response = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()


@pytest.mark.asyncio
async def test_duplicate_email_registration(client: AsyncClient):
    payload = {
        "name": "Farmer 1",
        "email": "duplicate@farm.org",
        "password": "password123",
    }
    res1 = await client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = await client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert res2.json()["error_code"] == "EMAIL_ALREADY_REGISTERED"


@pytest.mark.asyncio
async def test_invalid_login_credentials(client: AsyncClient):
    payload = {
        "email": "nonexistent@farm.org",
        "password": "wrongpassword",
    }
    res = await client.post("/api/v1/auth/login", json=payload)
    assert res.status_code == 401
    assert res.json()["error_code"] == "UNAUTHORIZED"
