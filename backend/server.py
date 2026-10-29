# © 2026 Ayanjit Shome. All rights reserved. Concept by Ayanjit Shome.
"""Surgical AI Hub API — FastAPI backed by SQLite (aiosqlite).

A single tools table stores the curated catalog plus cached GitHub README content.
We serialise non-scalar fields to JSON strings for easy portability.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import aiosqlite
import json
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel
from typing import Any, Literal
from datetime import datetime, timezone
from contextlib import asynccontextmanager

import seed_data

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# SQLite file path; defaults to a repo-local data/ dir so a fresh clone just runs.
DATABASE_PATH = os.environ.get('DATABASE_PATH', str(ROOT_DIR / 'data' / 'app.db'))
Path(DATABASE_PATH).parent.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Surgical AI Hub API")
api_router = APIRouter(prefix="/api")

# Authorship / copyright attribution (see LICENSE). Referenced across endpoints and headers.
AUTHOR = "Concept by Ayanjit Shome"
COPYRIGHT = "© 2026 Ayanjit Shome. All rights reserved."


@app.middleware("http")
async def _attribution_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Author"] = AUTHOR
    response.headers["X-Copyright"] = COPYRIGHT
    return response

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Maintenance endpoints (bulk refresh / reseed) require this token via the
# X-Admin-Token header. If unset, those endpoints are disabled (secure default).
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN')
# Reject well-known placeholder tokens so a default-config deploy can't be abused (SEC-001).
_WEAK_ADMIN_TOKENS = {"change-me-in-production", "change-me", "changeme", "admin", "secret", "password", "token"}
if ADMIN_TOKEN and ADMIN_TOKEN.strip().lower() in _WEAK_ADMIN_TOKENS:
    logger.warning("ADMIN_TOKEN is a known placeholder value; disabling admin endpoints until a strong token is set.")
    ADMIN_TOKEN = None
# Minimum seconds between per-tool GitHub refreshes (bounds outbound-call abuse).
REFRESH_COOLDOWN_SECONDS = 15


def require_admin(x_admin_token: str | None = Header(default=None)):
    if not ADMIN_TOKEN:
        raise HTTPException(status_code=503, detail="Admin endpoints are disabled (ADMIN_TOKEN not configured).")
    if not x_admin_token or x_admin_token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid or missing admin token.")
    return True


# ---------- Models ----------
class DecisionAnswers(BaseModel):
    repo_size: Literal["small", "medium", "large", "huge"] = "medium"
    languages: list[str] = []
    team_size: Literal["solo", "small-team", "large-team"] = "solo"
    agent: Literal["claude", "copilot", "codex", "antigravity"] = "claude"
    cost_sensitivity: Literal["low", "medium", "high"] = "medium"


# ---------- SQLite helpers ----------
# Scalar columns are a mild performance win; the rest of each tool payload lives
# in `data` as a JSON blob — simpler than mapping every field twice.
_SCHEMA = """
CREATE TABLE IF NOT EXISTS tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    layer TEXT,
    layer_name TEXT,
    layer_order INTEGER,
    tagline TEXT,
    token_waste_reduction INTEGER,
    color TEXT,
    github_owner TEXT,
    github_name TEXT,
    github_cache TEXT,
    github_fetched_at TEXT,
    data TEXT NOT NULL
);
"""


@asynccontextmanager
async def _get_db():
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA journal_mode=WAL;")
        await db.execute("PRAGMA foreign_keys=ON;")
        yield db


def _row_to_tool(row: aiosqlite.Row) -> dict[str, Any]:
    tool = json.loads(row["data"])
    tool["github_cache"] = row["github_cache"]
    tool["github_fetched_at"] = row["github_fetched_at"]
    return tool


# ---------- Seeding ----------
async def seed_database(force: bool = False):
    async with _get_db() as db:
        await db.executescript(_SCHEMA)
        cur = await db.execute("SELECT COUNT(*) AS n FROM tools;")
        row = await cur.fetchone()
        if row and row["n"] > 0 and not force:
            return
        if force:
            await db.execute("DELETE FROM tools;")
        rows = []
        for t in seed_data.TOOLS:
            rows.append((
                t["id"], t["name"], t.get("layer"), t.get("layer_name"),
                t.get("layer_order"), t.get("tagline"), t.get("token_waste_reduction"),
                t.get("color"), t.get("github_owner"), t.get("github_name"),
                None, None, json.dumps(t),
            ))
        await db.executemany(
            """INSERT INTO tools (id, name, layer, layer_name, layer_order, tagline,
                   token_waste_reduction, color, github_owner, github_name,
                   github_cache, github_fetched_at, data)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);""",
            rows,
        )
        await db.commit()
        logger.info("Seeded %d tools into %s", len(rows), DATABASE_PATH)


@app.on_event("startup")
async def on_startup():
    logger.info("%s | %s", AUTHOR, COPYRIGHT)
    await seed_database(force=False)


# ---------- GitHub fetch ----------
async def fetch_github_readme(owner: str, name: str) -> str | None:
    """Fetch README markdown from a public repo, unauthenticated."""
    api_url = f"https://api.github.com/repos/{owner}/{name}/readme"
    headers = {"Accept": "application/vnd.github.raw+json", "User-Agent": "toolkit-hub"}
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as c:
            r = await c.get(api_url, headers=headers)
            if r.status_code == 200:
                return r.text
            logger.warning("GitHub readme %s/%s -> %s", owner, name, r.status_code)
            return None
    except Exception as e:
        logger.warning("GitHub fetch failed for %s/%s: %s", owner, name, e)
        return None


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Surgical AI Hub API", "status": "ok", "author": AUTHOR, "copyright": COPYRIGHT}


@api_router.get("/meta")
async def get_meta():
    return {
        "platforms": seed_data.PLATFORMS,
        "workflow_stages": seed_data.WORKFLOW_STAGES,
        "adoption_order": seed_data.ADOPTION_ORDER,
        "author": AUTHOR,
        "copyright": COPYRIGHT,
    }


@api_router.get("/tools")
async def list_tools():
    async with _get_db() as db:
        cur = await db.execute("SELECT * FROM tools;")
        rows = await cur.fetchall()
    tools = [_row_to_tool(r) for r in rows]
    tools.sort(key=lambda x: seed_data.ADOPTION_ORDER.index(x["id"]) if x["id"] in seed_data.ADOPTION_ORDER else 99)
    return {"tools": tools}


@api_router.get("/tools/{tool_id}")
async def get_tool(tool_id: str):
    async with _get_db() as db:
        cur = await db.execute("SELECT * FROM tools WHERE id = ?;", (tool_id,))
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Tool not found")
    return _row_to_tool(row)


@api_router.get("/ecosystem")
async def get_ecosystem():
    async with _get_db() as db:
        cur = await db.execute(
            "SELECT id, name, layer, layer_name, layer_order, tagline, token_waste_reduction, color FROM tools;")
        rows = await cur.fetchall()
    nodes = [dict(r) for r in rows]
    nodes.sort(key=lambda x: seed_data.ADOPTION_ORDER.index(x["id"]) if x["id"] in seed_data.ADOPTION_ORDER else 99)
    return {
        "nodes": nodes,
        "edges": seed_data.ECOSYSTEM_EDGES,
        "stages": seed_data.WORKFLOW_STAGES,
    }


@api_router.post("/decision")
async def decision(answers: DecisionAnswers):
    result = seed_data.decision_recommendation(answers.model_dump())
    ids = result["recommended"]
    if not ids:
        result["tools"] = []
        return result
    placeholders = ",".join("?" * len(ids))
    async with _get_db() as db:
        cur = await db.execute(f"SELECT * FROM tools WHERE id IN ({placeholders});", ids)
        rows = await cur.fetchall()
    by_id = {r["id"]: _row_to_tool(r) for r in rows}
    result["tools"] = [by_id[t] for t in ids if t in by_id]
    return result


@api_router.get("/guidance/tradeoffs")
async def get_tradeoffs():
    return {"tradeoffs": seed_data.TRADEOFFS, "cost_playbook": seed_data.COST_PLAYBOOK}


@api_router.post("/admin/refresh/{tool_id}")
async def refresh_tool(tool_id: str):
    async with _get_db() as db:
        cur = await db.execute(
            "SELECT github_owner, github_name, github_fetched_at FROM tools WHERE id = ?;", (tool_id,))
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Tool not found")
    # Rate-limit per tool to curb outbound-call abuse.
    last = row["github_fetched_at"]
    if last:
        try:
            elapsed = (datetime.now(timezone.utc) - datetime.fromisoformat(last)).total_seconds()
            if elapsed < REFRESH_COOLDOWN_SECONDS:
                raise HTTPException(status_code=429, detail=f"Refreshed recently - wait {int(REFRESH_COOLDOWN_SECONDS - elapsed)}s before retrying.")
        except ValueError:
            pass
    readme = await fetch_github_readme(row["github_owner"], row["github_name"])
    now = datetime.now(timezone.utc).isoformat()
    async with _get_db() as db:
        if readme is not None:  # never blank out a previously good cache on failure
            await db.execute(
                "UPDATE tools SET github_cache = ?, github_fetched_at = ? WHERE id = ?;",
                (readme, now, tool_id),
            )
        else:
            await db.execute(
                "UPDATE tools SET github_fetched_at = ? WHERE id = ?;", (now, tool_id))
        await db.commit()
    return {"tool_id": tool_id, "fetched": readme is not None,
            "fetched_at": now, "length": len(readme) if readme else 0}


@api_router.post("/admin/refresh")
async def refresh_all(_: bool = Depends(require_admin)):
    async with _get_db() as db:
        cur = await db.execute("SELECT id, github_owner, github_name FROM tools;")
        rows = await cur.fetchall()
    results = []
    for row in rows:
        readme = await fetch_github_readme(row["github_owner"], row["github_name"])
        now = datetime.now(timezone.utc).isoformat()
        async with _get_db() as db:
            if readme is not None:
                await db.execute(
                    "UPDATE tools SET github_cache = ?, github_fetched_at = ? WHERE id = ?;",
                    (readme, now, row["id"]),
                )
            else:
                await db.execute(
                    "UPDATE tools SET github_fetched_at = ? WHERE id = ?;", (now, row["id"]))
            await db.commit()
        results.append({"tool_id": row["id"], "fetched": readme is not None,
                        "length": len(readme) if readme else 0})
    return {"results": results}


@api_router.post("/admin/reseed")
async def reseed(_: bool = Depends(require_admin)):
    await seed_database(force=True)
    return {"status": "reseeded"}


app.include_router(api_router)

_cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
app.add_middleware(
    CORSMiddleware,
    # No cookie/session auth in v1 - credentials disabled so a wildcard origin is safe.
    allow_credentials=False,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
