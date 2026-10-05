"""Security regression tests for admin gates, per-tool cooldown, and core API contracts."""
import os
import time

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
ADMIN_TOKEN = "local-dev-admin-6f3a9c2e"


@pytest.fixture(scope="module")
def client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def test_bulk_refresh_requires_token(client):
    response = client.post(f"{BASE_URL}/api/admin/refresh", timeout=30)
    assert response.status_code == 401
    assert "token" in response.text.lower()


def test_reseed_requires_token(client):
    response = client.post(f"{BASE_URL}/api/admin/reseed", timeout=30)
    assert response.status_code == 401
    assert "token" in response.text.lower()


def test_bulk_refresh_accepts_admin_token(client):
    response = client.post(
        f"{BASE_URL}/api/admin/refresh",
        headers={"X-Admin-Token": ADMIN_TOKEN},
        timeout=120,
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == 6
    assert {item["tool_id"] for item in data["results"]} == {
        "graft", "serena", "graphify", "codebase-memory", "archify", "agentsview"
    }


def test_reseed_accepts_admin_token(client):
    response = client.post(
        f"{BASE_URL}/api/admin/reseed",
        headers={"X-Admin-Token": ADMIN_TOKEN},
        timeout=30,
    )
    assert response.status_code == 200
    assert response.json() == {"status": "reseeded"}


def test_per_tool_refresh_is_rate_limited(client):
    # Agentsview is used here to avoid the other run's Graft cooldown state.
    first = client.post(f"{BASE_URL}/api/admin/refresh/agentsview", timeout=45)
    assert first.status_code == 200
    assert first.json()["tool_id"] == "agentsview"
    second = client.post(f"{BASE_URL}/api/admin/refresh/agentsview", timeout=30)
    assert second.status_code == 429
    assert "wait" in second.text.lower()


def test_core_routes_and_object_id_hygiene(client):
    tools = client.get(f"{BASE_URL}/api/tools", timeout=30)
    ecosystem = client.get(f"{BASE_URL}/api/ecosystem", timeout=30)
    guidance = client.get(f"{BASE_URL}/api/guidance/tradeoffs", timeout=30)
    assert tools.status_code == ecosystem.status_code == guidance.status_code == 200
    assert len(tools.json()["tools"]) == 6
    assert len(ecosystem.json()["nodes"]) == 6
    assert len(ecosystem.json()["edges"]) == 8
    assert all("_id" not in tool for tool in tools.json()["tools"])


def test_invalid_decision_enum_is_rejected(client):
    response = client.post(
        f"{BASE_URL}/api/decision",
        json={
            "repo_size": "invalid",
            "languages": ["python"],
            "team_size": "solo",
            "agent": "bogus",
            "cost_sensitivity": "invalid",
        },
        timeout=30,
    )
    assert response.status_code == 422
