"""r2 security regression checks for admin maintenance endpoints."""
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
ADMIN_TOKEN = "local-dev-admin-6f3a9c2e"


def test_bulk_refresh_requires_admin_token():
    response = requests.post(f"{BASE_URL}/api/admin/refresh", timeout=30)
    assert response.status_code == 401, response.text
    assert "token" in response.text.lower()


def test_reseed_requires_admin_token():
    response = requests.post(f"{BASE_URL}/api/admin/reseed", timeout=30)
    assert response.status_code == 401, response.text
    assert "token" in response.text.lower()


def test_bulk_refresh_accepts_admin_token():
    response = requests.post(
        f"{BASE_URL}/api/admin/refresh",
        headers={"X-Admin-Token": ADMIN_TOKEN},
        timeout=180,
    )
    assert response.status_code == 200, response.text
    results = response.json().get("results")
    assert isinstance(results, list) and len(results) == 6


def test_reseed_accepts_admin_token():
    response = requests.post(
        f"{BASE_URL}/api/admin/reseed",
        headers={"X-Admin-Token": ADMIN_TOKEN},
        timeout=30,
    )
    assert response.status_code == 200, response.text
    assert response.json() == {"status": "reseeded"}


def test_per_tool_refresh_is_rate_limited():
    first = requests.post(f"{BASE_URL}/api/admin/refresh/archify", timeout=45)
    assert first.status_code == 200, first.text
    second = requests.post(f"{BASE_URL}/api/admin/refresh/archify", timeout=30)
    assert second.status_code == 429, second.text
    assert "wait" in second.text.lower() or "recent" in second.text.lower()
