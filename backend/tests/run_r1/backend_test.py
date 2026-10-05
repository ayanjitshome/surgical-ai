"""API regression coverage for metadata, tools, ecosystem, decision, guidance and README refresh."""
import os
from datetime import datetime

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")


@pytest.fixture(scope="module")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestReadApis:
    def test_meta_shape_and_order(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/meta", timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert [p["id"] for p in data["platforms"]] == ["mac", "windows", "wsl", "container", "remote-ssh", "corporate"]
        assert len(data["workflow_stages"]) == 4
        assert data["adoption_order"] == ["graft", "serena", "graphify", "codebase-memory", "archify", "agentsview"]

    def test_tools_sorted_and_complete(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/tools", timeout=30)
        assert response.status_code == 200
        tools = response.json()["tools"]
        assert [tool["id"] for tool in tools] == ["graft", "serena", "graphify", "codebase-memory", "archify", "agentsview"]
        assert all({"overview", "mechanics", "adoption_note", "platform_notes", "setup_steps", "stats"}.issubset(tool) for tool in tools)
        assert all("_id" not in tool for tool in tools)

    @pytest.mark.parametrize("tool_id", ["graft", "serena", "graphify", "codebase-memory", "archify", "agentsview"])
    def test_tool_detail_contains_all_content(self, api_client, tool_id):
        response = api_client.get(f"{BASE_URL}/api/tools/{tool_id}", timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == tool_id
        assert isinstance(data["overview"], str) and data["overview"]
        assert isinstance(data["mechanics"], str) and data["mechanics"]
        assert len(data["platform_notes"]) == 6
        assert len(data["setup_steps"]) >= 3
        assert set(data["stats"]) == {"token_saved", "latency", "setup_time"}
        assert "_id" not in data

    def test_unknown_tool_is_404(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/tools/not-a-tool", timeout=30)
        assert response.status_code == 404
        assert "Tool not found" in response.text

    def test_ecosystem_shape(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/ecosystem", timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert len(data["nodes"]) == 6
        assert len(data["edges"]) == 8
        assert len(data["stages"]) == 4
        node_ids = {node["id"] for node in data["nodes"]}
        assert node_ids == {"graft", "serena", "graphify", "codebase-memory", "archify", "agentsview"}
        assert all(edge["source"] in node_ids and edge["target"] in node_ids for edge in data["edges"])

    def test_guidance_shape(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/guidance/tradeoffs", timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert len(data["tradeoffs"]) == 2
        assert len(data["cost_playbook"]) == 6
        assert all({"title", "option_a", "option_b", "guidance", "winner_when"}.issubset(x) for x in data["tradeoffs"])


class TestDecision:
    def test_decision_returns_recommendation_for_sample_answers(self, api_client):
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
        assert data["recommended"] == data["adoption_order"]
        assert data["recommended"] == ["graft", "serena", "graphify", "codebase-memory", "archify", "agentsview"]
        assert isinstance(data["estimated_savings_pct"], int)
        assert 0 <= data["estimated_savings_pct"] <= 72
        assert set(data["reasons"]) == set(data["recommended"])
        assert [tool["id"] for tool in data["tools"]] == data["recommended"]
        assert all("_id" not in tool for tool in data["tools"])

    def test_decision_rejects_wrong_field_types(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/decision", json={"languages": "python"}, timeout=30)
        assert response.status_code == 422

    def test_decision_rejects_unknown_enum_values(self, api_client):
        payload = {
            "repo_size": "invalid",
            "languages": ["python"],
            "team_size": "solo",
            "agent": "bogus",
            "cost_sensitivity": "invalid",
        }
        response = api_client.post(f"{BASE_URL}/api/decision", json=payload, timeout=30)
        assert response.status_code == 422


class TestRefresh:
    def test_refresh_single_tool_persists_timestamp(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/admin/refresh/graft", timeout=45)
        assert response.status_code == 200
        data = response.json()
        assert data["tool_id"] == "graft"
        assert isinstance(data["fetched"], bool)
        assert isinstance(data["length"], int)
        assert datetime.fromisoformat(data["fetched_at"].replace("Z", "+00:00"))

        detail = api_client.get(f"{BASE_URL}/api/tools/graft", timeout=30)
        assert detail.status_code == 200
        persisted = detail.json()
        assert persisted["github_fetched_at"] == data["fetched_at"]
        if data["fetched"]:
            assert isinstance(persisted["github_cache"], str) and len(persisted["github_cache"]) == data["length"]
        else:
            assert persisted["github_cache"] is None

    def test_refresh_unknown_tool_is_404(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/admin/refresh/not-a-tool", timeout=30)
        assert response.status_code == 404

    def test_refresh_all_returns_every_tool(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/admin/refresh", timeout=120)
        assert response.status_code == 200
        results = response.json()["results"]
        assert len(results) == 6
        assert {item["tool_id"] for item in results} == {"graft", "serena", "graphify", "codebase-memory", "archify", "agentsview"}
        assert all(isinstance(item["fetched"], bool) and isinstance(item["length"], int) for item in results)
