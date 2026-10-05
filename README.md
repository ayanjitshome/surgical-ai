# AI Agent Toolkit Hub

An internal knowledge-product SPA that gives opinionated guidance on setting up and orchestrating six developer tools — **Graft, Serena, Graphify, Codebase Memory, Archify, Agentsview** — to reduce AI-agent token waste in VSCode.

- **Knowledge Base** — per-tool deep-dive pages (what, why, token mechanics, adoption order, platform notes, cached GitHub README)
- **Guided Setup Wizard** — platform-aware, step-by-step, with copy-paste commands, validation checkpoints and troubleshooting
- **Decision Support Guide** — a short questionnaire that outputs a recommended tool stack with reasoning and estimated savings
- **Interactive Ecosystem Dependency Map** — a pannable/zoomable React Flow graph of how the tools connect

---

## Tech Stack

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Frontend   | React 19 (CRA + craco), React Router, Tailwind CSS            |
| Viz        | React Flow (`@xyflow/react`)                                  |
| Backend    | FastAPI (Python)                                              |
| Database   | MongoDB (via Motor)                                           |
| GitHub     | GitHub REST API (unauthenticated) via `httpx`, cached in Mongo|

```
.
├── backend/            # FastAPI app
│   ├── server.py       # API entrypoint (app = FastAPI())
│   ├── seed_data.py    # Curated tool content (seeded to MongoDB)
│   ├── requirements.txt
│   └── .env            # NOT committed — create locally
└── frontend/           # React app
    ├── src/
    ├── package.json
    └── .env            # NOT committed — create locally
```

---

## Prerequisites

- **Python 3.8+**
- **Node.js 18+** and **Yarn** (`npm install -g yarn`)
- **MongoDB** — install locally, or run with Docker:
  ```bash
  docker run -d -p 27017:27017 --name toolkit-mongo mongo
  ```

---

## 1. Clone

```bash
git clone <your-github-repo-url>
cd <your-repo-name>
```

## 2. Environment variables

`.env` files are **not** committed to Git. Create them manually.

**`backend/.env`**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=toolkit_hub
CORS_ORIGINS=http://localhost:3000
```

**`frontend/.env`**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

> The frontend calls `${REACT_APP_BACKEND_URL}/api/...`, so the backend **must** stay on port `8001` with the `/api` prefix (or update this value to match).

## 3. Install dependencies

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend (new terminal)
cd frontend
yarn install
```

## 4. Run

Make sure **MongoDB is running first**, then:

```bash
# Backend — from /backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend — from /frontend (new terminal)
yarn start
```

- Frontend: **http://localhost:3000**
- Backend API: **http://localhost:8001/api**

On first boot the backend **auto-seeds** all six tools into MongoDB — no manual seed step needed.

---

## API Endpoints (all prefixed with `/api`)

| Method | Path                         | Purpose                                   |
| ------ | ---------------------------- | ----------------------------------------- |
| GET    | `/api/meta`                  | Platforms, workflow stages, adoption order|
| GET    | `/api/tools`                 | All six tools (adoption order)            |
| GET    | `/api/tools/{id}`            | Full tool detail                          |
| GET    | `/api/ecosystem`             | Nodes + edges for the dependency map      |
| POST   | `/api/decision`              | Rule-based stack recommendation           |
| GET    | `/api/guidance/tradeoffs`    | Tradeoffs + cost playbook                 |
| POST   | `/api/admin/refresh/{id}`    | Fetch & cache one tool's GitHub README    |
| POST   | `/api/admin/refresh`         | Refresh all READMEs                       |
| POST   | `/api/admin/reseed`          | Re-seed tool content                      |

GitHub README fetching is **unauthenticated** — no token required. Use the "Refresh from GitHub" button on a tool page (or the endpoints above) to populate the README cache.

---

## Notes

- **Supervisor** is only used in the hosted environment. Locally you just run the two commands above.
- There is **no authentication** in v1.
- If `yarn start` can't reach the API, confirm the backend is up on `:8001` and that `CORS_ORIGINS` includes `http://localhost:3000`.

---

## Can the frontend run without the backend?

**Short answer: the frontend dev server will start and render the shell, but the app is non-functional without the backend.**

Everything the user actually interacts with is loaded from the API (there is no static/offline fallback), so with the backend down:

| Area | Behaviour with backend OFF |
| ---- | -------------------------- |
| Page shell (sidebar, header, hero text, theme toggle) | ✅ Renders fine — it's static |
| **Ecosystem map** (home) | ❌ Empty bordered box — it only renders when `/api/ecosystem` returns (`{eco && <EcosystemMap/>}`) |
| **Sidebar tool list / stages / platforms** | ❌ Empty — populated from `/api/tools` and `/api/meta` |
| **Tool detail pages** | ❌ Stuck on "Loading tool…" (the `/api/tools/{id}` query never resolves) |
| **Decision questionnaire** | ⚠️ Questions render (they're hardcoded), but **Submit fails** — it POSTs to `/api/decision` |
| **Guidance / tradeoffs / adoption order** | ❌ Empty — from `/api/guidance` and `/api/tools` |
| **Search (Cmd+K)** | ⚠️ Opens, but returns no results (the index is built from `/api/tools`) |

**Why:** the frontend has no hardcoded content — all tool metadata, the dependency graph, the recommendation logic and the GitHub READMEs live in the backend + MongoDB. React Query requests simply fail (network error / pending), and components either show empty defaults (`[]`) or a loading state.

**So, to see anything useful you must run all three:** MongoDB → FastAPI backend → React frontend. If the UI loads but looks empty, the backend (or MongoDB) is almost certainly not running, or `REACT_APP_BACKEND_URL` is pointing at the wrong place.
