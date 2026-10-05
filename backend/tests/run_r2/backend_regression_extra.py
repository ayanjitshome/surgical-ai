"""Additional r2 regression checks for startup configuration, reseeding and edge handling."""
import asyncio
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
TOOL_IDS = ["graft", "serena", "graphify", "codebase-memory", "archify", "agentsview"]


@pytest.fixture(scope="module")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def _import_server_in_isolated_dir(environment):
    """Import server.py without a .env file to exercise fresh-clone defaults."""
    with tempfile.TemporaryDirectory(prefix="toolkit-startup-") as isolated:
        isolated_path = Path(isolated)
        shutil.copy("/app/backend/server.py", isolated_path / "server.py")
        shutil.copy("/app/backend/seed_data.py", isolated_path / "seed_data.py")
        env = os.environ.copy()
        env.pop("MONGO_URL", None)
        env.pop("DB_NAME", None)
        env.update(environment)
        env["PYTHONPATH"] = str(isolated_path)
        result = subprocess.run(
            [sys.executable, "-c", "import server; print(server.mongo_url); print(server.db.name)"],
            cwd=isolated,
            env=env,
            capture_output=True,
            text=True,
            timeout=30,
        )
        assert result.returncode == 0, result.stderr
        return result.stdout.splitlines()


def test_server_imports_without_env_file_using_defaults():
    output = _import_server_in_isolated_dir({})
    assert output == ["mongodb://localhost:27017", "toolkit_hub"]


def test_environment_values_take_precedence_over_defaults():
    output = _import_server_in_isolated_dir(
        {"MONGO_URL": "mongodb://configured.example:27018", "DB_NAME": "test_database"}
    )
    assert output == ["mongodb://configured.example:27018", "test_database"]


def test_reseed_recreates_six_tools_and_content():
    response = requests.post(f"{BASE_URL}/api/admin/reseed", timeout=30)
    assert response.status_code == 200
    assert response.json() == {"status": "reseeded"}
    tools_response = requests.get(f"{BASE_URL}/api/tools", timeout=30)
    assert tools_response.status_code == 200
    tools = tools_response.json()["tools"]
    assert [tool["id"] for tool in tools] == TOOL_IDS
    assert all(tool["github_cache"] is None and tool["github_fetched_at"] is None for tool in tools)


def test_platform_overrides_are_on_each_tool_first_setup_step(api_client):
    response = api_client.get(f"{BASE_URL}/api/tools", timeout=30)
    assert response.status_code == 200
    for tool in response.json()["tools"]:
        steps = tool["setup_steps"]
        assert steps and "platform_overrides" in steps[0]
        assert set(steps[0]["platform_overrides"]) == {
            "windows", "wsl", "container", "remote-ssh", "corporate"
        }
        for override in steps[0]["platform_overrides"].values():
            assert isinstance(override["note"], str) and override["note"]


@pytest.mark.parametrize(
    ("field", "invalid"),
    [
        ("repo_size", "invalid-repo"),
        ("team_size", "invalid-team"),
        ("agent", "invalid-agent"),
        ("cost_sensitivity", "invalid-cost"),
    ],
)
def test_each_decision_enum_rejects_unknown_value(api_client, field, invalid):
    payload = {
        "repo_size": "medium",
        "languages": ["python"],
        "team_size": "solo",
        "agent": "claude",
        "cost_sensitivity": "medium",
    }
    payload[field] = invalid
    response = api_client.post(f"{BASE_URL}/api/decision", json=payload, timeout=30)
    assert response.status_code == 422


def test_github_fetch_returns_none_on_transport_failure(monkeypatch):
    import server

    class BrokenClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, *args, **kwargs):
            raise RuntimeError("simulated unreachable GitHub")

    monkeypatch.setattr(server.httpx, "AsyncClient", lambda **kwargs: BrokenClient())
    assert asyncio.run(server.fetch_github_readme("unreachable-owner", "unreachable-repo")) is None
