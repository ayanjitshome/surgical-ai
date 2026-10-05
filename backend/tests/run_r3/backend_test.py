"""r3 API regression coverage for AI Agent Toolkit Hub critical endpoints."""
import os
from datetime import datetime

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
TOOL_IDS = ["graft", "serena", "graphify", "codebase-memory", "archify", "agentsview"]


@pytest.fixture(scope="module")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestMetadataAndContent:
    """Metadata, tool content, ecosystem and guidance read APIs."""

    def test_meta_returns_expected_taxonomy(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/meta", timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert [p["id"] for p in data["platforms"]] == ["mac", "windows", "wsl", "container", "remote-ssh", "corporate"]
        assert len(data["workflow_stages"]) == 4
        assert data["adoption_order"] == TOOL_IDS

    def test_tools_returns_six_sorted_tools_without_mongo_id(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/tools", timeout=30)
        assert response.status_code == 200
        tools = response.json()["tools"]
        assert [t["id"] for t in tools] == TOOL_IDS
        assert all("_id" not in t for t in tools)
        assert all({"overview", "mechanics", "adoption_note", "platform_notes", "setup_steps", "stats"}.issubset(t) for t in tools)

    @pytest.mark.parametrize("tool_id", TOOL_IDS)
    def test_tool_detail_returns_deep_dive_content(self, api_client, tool_id):
        response = api_client.get(f"{BASE_URL}/api/tools/{tool_id}", timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == tool_id
        assert data["overview"] and data["mechanics"] and data["adoption_note"]
        assert set(data["platform_notes"]) == {"mac", "windows", "wsl", "container", "remote-ssh", "corporate"}
        assert len(data["setup_steps"]) >= 3
        assert set(data["stats"]) == {"token_saved", "latency", "setup_time"}
        assert "_id" not in data

    def test_unknown_tool_returns_404(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/tools/not-a-tool", timeout=30)
        assert response.status_code == 404
        assert "Tool not found" in response.text

    def test_ecosystem_returns_six_nodes_eight_edges_and_stages(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/ecosystem", timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert len(data["nodes"]) == 6
        assert len(data["edges"]) == 8
        assert len(data["stages"]) == 4
        assert {n["id"] for n in data["nodes"]} == set(TOOL_IDS)
        assert all(e["source"] in TOOL_IDS and e["target"] in TOOL_IDS for e in data["edges"])

    def test_guidance_returns_tradeoffs_and_cost_playbook(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/guidance/tradeoffs", timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert len(data["tradeoffs"]) == 2
        assert len(data["cost_playbook"]) == 6
        assert all({"title", "option_a", "option_b", "guidance", "winner_when"}.issubset(t) for t in data["tradeoffs"])


class TestDecision:
    """Decision support validation and recommendation response contract."""

    def test_sample_answers_return_full_recommendation(self, api_client):
        payload = {
            "repo_size": "large",
            "languages": ["typescript", "python", "go"],
            "team_size": "small-team",
            "agent": "claude",
            "cost_sensitivity": "high",
        }
        response = api_client.post(f"{BASE_URL}/api/decision", json=payload, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert data["recommended"] == TOOL_IDS
        assert data["adoption_order"] == data["recommended"]
        assert isinstance(data["estimated_savings_pct"], int)
        assert 0 <= data["estimated_savings_pct"] <= 72
        assert set(data["reasons"]) == set(TOOL_IDS)
        assert [t["id"] for t in data["tools"]] == TOOL_IDS
        assert all("_id" not in t for t in data["tools"])

    def test_languages_wrong_type_is_rejected(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/decision", json={"languages": "python"}, timeout=30)
        assert response.status_code == 422

    def test_decision_rejects_unknown_values(self, api_client):
        payload = {
            "repo_size": "invalid",
            "languages": ["python"],
            "team_size": "solo",
            "agent": "bogus",
            "cost_sensitivity": "invalid",
        }
        response = api_client.post(f"{BASE_URL}/api/decision", json=payload, timeout=30)
        assert response.status_code == 422


class TestAdminRefresh:
    """Unauthenticated README refresh and cache persistence."""

    def test_refresh_single_tool_persists_cache_fields(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/admin/refresh/graft", timeout=45)
        assert response.status_code == 200
        data = response.json()
        assert data["tool_id"] == "graft"
        assert isinstance(data["fetched"], bool)
        assert isinstance(data["length"], int)
        datetime.fromisoformat(data["fetched_at"].replace("Z", "+00:00"))
        detail = api_client.get(f"{BASE_URL}/api/tools/graft", timeout=30)
        assert detail.status_code == 200
        persisted = detail.json()
        assert persisted["github_fetched_at"] == data["fetched_at"]
        if data["fetched"]:
            assert isinstance(persisted["github_cache"], str) and len(persisted["github_cache"]) == data["length"]
        else:
            assert persisted["github_cache"] is None

    def test_refresh_unknown_tool_returns_404(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/admin/refresh/not-a-tool", timeout=30)
        assert response.status_code == 404

    def test_refresh_all_returns_each_tool_gracefully(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/admin/refresh", timeout=120)
        assert response.status_code == 200
        results = response.json()["results"]
        assert len(results) == 6
        assert {r["tool_id"] for r in results} == set(TOOL_IDS)
        assert all(isinstance(r["fetched"], bool) and isinstance(r["length"], int) for r in results)
