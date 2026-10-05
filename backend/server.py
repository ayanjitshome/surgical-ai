from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime, timezone

import seed_data

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="AI Agent Toolkit Hub API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------- Models ----------
class DecisionAnswers(BaseModel):
    repo_size: Literal["small", "medium", "large", "huge"] = "medium"
    languages: List[str] = []
    team_size: Literal["solo", "small-team", "large-team"] = "solo"
    agent: Literal["claude", "copilot", "codex", "antigravity"] = "claude"
    cost_sensitivity: Literal["low", "medium", "high"] = "medium"


# ---------- Seeding ----------
async def seed_database(force: bool = False):
    count = await db.tools.count_documents({})
    if count > 0 and not force:
        return
    await db.tools.delete_many({})
    docs = []
    for t in seed_data.TOOLS:
        doc = dict(t)
        doc["_id"] = t["id"]
        doc["github_cache"] = None
        doc["github_fetched_at"] = None
        docs.append(doc)
    await db.tools.insert_many(docs)
    logger.info("Seeded %d tools", len(docs))


@app.on_event("startup")
async def on_startup():
    await seed_database(force=False)


# ---------- GitHub fetch ----------
async def fetch_github_readme(owner: str, name: str) -> Optional[str]:
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


def _clean(doc: Dict[str, Any]) -> Dict[str, Any]:
    doc.pop("_id", None)
    return doc


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "AI Agent Toolkit Hub API", "status": "ok"}


@api_router.get("/meta")
async def get_meta():
    return {
        "platforms": seed_data.PLATFORMS,
        "workflow_stages": seed_data.WORKFLOW_STAGES,
        "adoption_order": seed_data.ADOPTION_ORDER,
    }


@api_router.get("/tools")
async def list_tools():
    docs = await db.tools.find({}).to_list(100)
    tools = [_clean(d) for d in docs]
    tools.sort(key=lambda x: seed_data.ADOPTION_ORDER.index(x["id"]) if x["id"] in seed_data.ADOPTION_ORDER else 99)
    return {"tools": tools}


@api_router.get("/tools/{tool_id}")
async def get_tool(tool_id: str):
    doc = await db.tools.find_one({"_id": tool_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Tool not found")
    return _clean(doc)


@api_router.get("/ecosystem")
async def get_ecosystem():
    docs = await db.tools.find({}).to_list(100)
    nodes = []
    for d in docs:
        nodes.append({
            "id": d["id"], "name": d["name"], "layer": d["layer"],
            "layer_name": d["layer_name"], "layer_order": d["layer_order"],
            "tagline": d["tagline"], "token_waste_reduction": d["token_waste_reduction"],
            "color": d["color"],
        })
    nodes.sort(key=lambda x: seed_data.ADOPTION_ORDER.index(x["id"]))
    return {
        "nodes": nodes,
        "edges": seed_data.ECOSYSTEM_EDGES,
        "stages": seed_data.WORKFLOW_STAGES,
    }


@api_router.post("/decision")
async def decision(answers: DecisionAnswers):
    result = seed_data.decision_recommendation(answers.model_dump())
    docs = await db.tools.find({"_id": {"$in": result["recommended"]}}).to_list(100)
    by_id = {d["id"]: _clean(d) for d in docs}
    result["tools"] = [by_id[t] for t in result["recommended"] if t in by_id]
    return result


@api_router.get("/guidance/tradeoffs")
async def get_tradeoffs():
    return {"tradeoffs": seed_data.TRADEOFFS, "cost_playbook": seed_data.COST_PLAYBOOK}


@api_router.post("/admin/refresh/{tool_id}")
async def refresh_tool(tool_id: str):
    doc = await db.tools.find_one({"_id": tool_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Tool not found")
    readme = await fetch_github_readme(doc["github_owner"], doc["github_name"])
    now = datetime.now(timezone.utc).isoformat()
    await db.tools.update_one(
        {"_id": tool_id},
        {"$set": {"github_cache": readme, "github_fetched_at": now}},
    )
    return {"tool_id": tool_id, "fetched": readme is not None,
            "fetched_at": now, "length": len(readme) if readme else 0}


@api_router.post("/admin/refresh")
async def refresh_all():
    docs = await db.tools.find({}).to_list(100)
    results = []
    for doc in docs:
        readme = await fetch_github_readme(doc["github_owner"], doc["github_name"])
        now = datetime.now(timezone.utc).isoformat()
        await db.tools.update_one(
            {"_id": doc["_id"]},
            {"$set": {"github_cache": readme, "github_fetched_at": now}},
        )
        results.append({"tool_id": doc["_id"], "fetched": readme is not None,
                        "length": len(readme) if readme else 0})
    return {"results": results}


@api_router.post("/admin/reseed")
async def reseed():
    await seed_database(force=True)
    return {"status": "reseeded"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
