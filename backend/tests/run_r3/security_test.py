"""r3 security regression coverage for admin endpoint protection and refresh cooldown."""
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    with open("/app/frontend/.env", encoding="utf-8") as f:
        BASE_URL = next(line.split("=", 1)[1].strip() for line in f if line.startswith("REACT_APP_BACKEND_URL="))
BASE_URL = BASE_URL.rstrip("/")
ADMIN_TOKEN = "local-dev-admin-6f3a9c2e"


def test_admin_bulk_refresh_rejects_missing_token_and_accepts_valid_token():
    r = requests.post(f"{BASE_URL}/api/admin/refresh", timeout=120)
    assert r.status_code == 401, r.text
    r = requests.post(f"{BASE_URL}/api/admin/refresh", headers={"X-Admin-Token": ADMIN_TOKEN}, timeout=120)
    assert r.status_code == 200, r.text
    body = r.json()
    assert len(body["results"]) == 6
    assert {item["tool_id"] for item in body["results"]} == {"graft", "serena", "graphify", "codebase-memory", "archify", "agentsview"}


def test_admin_reseed_rejects_missing_token_and_accepts_valid_token():
    r = requests.post(f"{BASE_URL}/api/admin/reseed", timeout=30)
    assert r.status_code == 401, r.text
    r = requests.post(f"{BASE_URL}/api/admin/reseed", headers={"X-Admin-Token": ADMIN_TOKEN}, timeout=30)
    assert r.status_code == 200, r.text
    assert r.json() == {"status": "reseeded"}


def test_per_tool_refresh_is_open_but_cooldown_limited():
    # Reseed above clears the timestamp, making this test deterministic.
    first = requests.post(f"{BASE_URL}/api/admin/refresh/graft", timeout=45)
    assert first.status_code == 200, first.text
    assert first.json()["tool_id"] == "graft"
    second = requests.post(f"{BASE_URL}/api/admin/refresh/graft", timeout=30)
    assert second.status_code == 429, second.text
    assert "wait" in second.json().get("detail", "").lower()
