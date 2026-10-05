# Surgical AI Hub

An internal knowledge-product SPA that gives opinionated guidance on setting up and orchestrating six developer tools - **Graft, Serena, Graphify, Codebase Memory, Archify, Agentsview** - to reduce AI-agent token waste in VSCode.

- **Knowledge Base** - per-tool deep-dive pages (what, why, token mechanics, adoption order, platform notes, cached GitHub README)
- **Guided Setup Wizard** - platform-aware, step-by-step, with copy-paste commands, validation checkpoints and troubleshooting
- **Decision Support Guide** - a short questionnaire that outputs a recommended tool stack with reasoning and estimated savings
- **Interactive Ecosystem Dependency Map** - a pannable/zoomable React Flow graph of how the tools connect

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
│   └── .env            # NOT committed - create locally
└── frontend/           # React app
    ├── src/
    ├── package.json
    └── .env            # NOT committed - create locally
```

---

## Prerequisites

- **Python 3.8+** (tested through Python 3.13 - all backend deps ship prebuilt wheels, no compiler/Rust needed)
- **Node.js 18+** and **Yarn** (`npm install -g yarn`)
- **MongoDB 6.0+** running locally on the default port `27017` (see the per-platform install guide below)

---

## MongoDB setup (per platform)

The backend needs a running MongoDB reachable at `mongodb://localhost:27017`. Pick the option for your OS. The database and collections are created automatically on first run - no manual DB creation needed.

### Option A - Docker (any platform, simplest)
Works identically on macOS, Windows, Linux and WSL. Requires Docker Desktop / Docker Engine.
```bash
docker run -d --name surgical-ai-mongo -p 27017:27017 -v surgical-ai-mongo-data:/data/db mongo:7
```
- `-v ...-data:/data/db` persists your data across restarts.
- Start/stop later with `docker start surgical-ai-mongo` / `docker stop surgical-ai-mongo`.

### macOS (Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0   # runs on localhost:27017
```
Stop with `brew services stop mongodb-community@7.0`.

### Windows
1. Download the **MongoDB Community Server** MSI from https://www.mongodb.com/try/download/community
2. Run the installer, choose **Complete**, and tick **Install MongoDB as a Service** (it then auto-starts on `localhost:27017`).
3. (Optional) Install **MongoDB Compass** for a GUI.

Or with Chocolatey:
```powershell
choco install mongodb
```

### Linux (Ubuntu / Debian)
```bash
sudo apt-get update
sudo apt-get install -y gnupg curl
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl enable --now mongod   # runs on localhost:27017
```

### WSL (Windows Subsystem for Linux)
Easiest is **Docker Desktop** with WSL integration (Option A). If you prefer a native install, follow the **Linux (Ubuntu)** steps **inside** your WSL distro, then start it with:
```bash
sudo systemctl start mongod          # or: sudo service mongod start
```
Keep the connection string as `mongodb://localhost:27017` - WSL forwards localhost to the Windows host.

### Verify MongoDB is up
```bash
mongosh --eval "db.runCommand({ ping: 1 })"   # expect { ok: 1 }
```

---

## 1. Clone

```bash
git clone <your-github-repo-url>
cd <your-repo-name>
```

## 2. Environment variables

`.env` files are **not** committed to Git (an `.env.example` is provided in each folder as a template - copy it to `.env`). Create them manually:

**`backend/.env`**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=surgical_ai_hub
CORS_ORIGINS=http://localhost:3000
# Optional: only needed to call the maintenance endpoints
# (POST /api/admin/refresh and /api/admin/reseed). Leave unset to disable them.
# The per-tool "Refresh from GitHub" button does NOT need this.
ADMIN_TOKEN=change-me-to-a-long-random-string
```

**`frontend/.env`**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

> Quick copy: `cp backend/.env.example backend/.env` and `cp frontend/.env.example frontend/.env`, then adjust values.

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
# Backend - from /backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend - from /frontend (new terminal)
yarn start
```

- Frontend: **http://localhost:3000**
- Backend API: **http://localhost:8001/api**

On first boot the backend **auto-seeds** all six tools into MongoDB - no manual seed step needed.

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

GitHub README fetching is **unauthenticated** - no token required. Use the "Refresh from GitHub" button on a tool page (or the endpoints above) to populate the README cache.

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
| Page shell (sidebar, header, hero text, theme toggle) | ✅ Renders fine - it's static |
| **Ecosystem map** (home) | ❌ Empty bordered box - it only renders when `/api/ecosystem` returns (`{eco && <EcosystemMap/>}`) |
| **Sidebar tool list / stages / platforms** | ❌ Empty - populated from `/api/tools` and `/api/meta` |
| **Tool detail pages** | ❌ Stuck on "Loading tool…" (the `/api/tools/{id}` query never resolves) |
| **Decision questionnaire** | ⚠️ Questions render (they're hardcoded), but **Submit fails** - it POSTs to `/api/decision` |
| **Guidance / tradeoffs / adoption order** | ❌ Empty - from `/api/guidance` and `/api/tools` |
| **Search (Cmd+K)** | ⚠️ Opens, but returns no results (the index is built from `/api/tools`) |

**Why:** the frontend has no hardcoded content - all tool metadata, the dependency graph, the recommendation logic and the GitHub READMEs live in the backend + MongoDB. React Query requests simply fail (network error / pending), and components either show empty defaults (`[]`) or a loading state.

**So, to see anything useful you must run all three:** MongoDB → FastAPI backend → React frontend. If the UI loads but looks empty, the backend (or MongoDB) is almost certainly not running, or `REACT_APP_BACKEND_URL` is pointing at the wrong place.
