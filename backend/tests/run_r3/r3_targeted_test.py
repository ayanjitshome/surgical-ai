"""r3 targeted API regression checks for security, validation, and public routes."""
import os
from datetime import datetime

import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
ADMIN_TOKEN = "local-dev-admin-6f3a9c2e"
TOOL_IDS = ["graft", "serena", "graphify", "codebase-memory", "archify", "agentsview"]


def test_public_endpoints_and_content_contract():
    s = requests.Session()
    for path in ["/api/meta", "/api/tools", "/api/ecosystem", "/api/guidance/tradeoffs"]:
        r = s.get(BASE_URL + path, timeout=30)
        assert r.status_code == 200, (path, r.text)
        assert isinstance(r.json(), dict)
    tools = s.get(BASE_URL + "/api/tools", timeout=30).json()["tools"]
    assert [tool["id"] for tool in tools] == TOOL_IDS
    assert all("_id" not in tool for tool in tools)
    detail = s.get(BASE_URL + "/api/tools/graft", timeout=30)
    assert detail.status_code == 200
    assert detail.json()["id"] == "graft"
    assert s.get(BASE_URL + "/api/tools/no-such-tool", timeout=30).status_code == 404


def test_decision_validation_and_valid_recommendation():
    s = requests.Session()
    invalid = s.post(BASE_URL + "/api/decision", json={"repo_size": "bogus"}, timeout=30)
    assert invalid.status_code == 422, invalid.text
    valid = s.post(BASE_URL + "/api/decision", json={
        "repo_size": "large", "languages": ["typescript", "python"],
        "team_size": "small-team", "agent": "claude", "cost_sensitivity": "high",
    }, timeout=30)
    assert valid.status_code == 200, valid.text
    body = valid.json()
    assert body["recommended"]
    assert body["adoption_order"] == body["recommended"]
    assert [tool["id"] for tool in body["tools"]] == body["recommended"]


def test_bulk_admin_token_gate_and_success():
    s = requests.Session()
    missing = s.post(BASE_URL + "/api/admin/refresh", timeout=30)
    assert missing.status_code == 401, missing.text
    valid = s.post(BASE_URL + "/api/admin/refresh", headers={"X-Admin-Token": ADMIN_TOKEN}, timeout=120)
    assert valid.status_code == 200, valid.text
    results = valid.json()["results"]
    assert {item["tool_id"] for item in results} == set(TOOL_IDS)
    assert all(isinstance(item["length"], int) for item in results)


def test_reseed_token_gate_and_per_tool_cooldown():
    s = requests.Session()
    missing = s.post(BASE_URL + "/api/admin/reseed", timeout=30)
    assert missing.status_code == 401, missing.text
    reseed = s.post(BASE_URL + "/api/admin/reseed", headers={"X-Admin-Token": ADMIN_TOKEN}, timeout=30)
    assert reseed.status_code == 200
    assert reseed.json() == {"status": "reseeded"}
    first = s.post(BASE_URL + "/api/admin/refresh/archify", timeout=45)
    assert first.status_code == 200, first.text
    payload = first.json()
    assert payload["tool_id"] == "archify"
    datetime.fromisoformat(payload["fetched_at"].replace("Z", "+00:00"))
    second = s.post(BASE_URL + "/api/admin/refresh/archify", timeout=30)
    assert second.status_code == 429, second.text
    assert "wait" in second.json()["detail"].lower()
