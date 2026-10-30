# Surgical AI Hub

<p align="center">
  <img src="assets/surgical-ai-hub-logo.png" alt="Surgical AI Hub" width="300" />
</p>

A single-page app that shows you how to combine seven developer tools (Ponytail, Trail, Serena, Graphify, Codebase Memory, Archify, Agentsview) to cut token waste in any AI-agentic IDE (Claude Code, Copilot, Codex, Antigravity).

- **Ecosystem Hub.** Pannable React Flow graph of how the tools depend on each other.
- **Decision Guide.** Short questionnaire that outputs a recommended stack with reasoning and estimated savings.
- **Prompt Playbook and Prompt Builder.** Ready-to-copy prompts with a live BPE token count (o200k_base) next to the agent dropdown.
- **Token Economy.** Interactive cost calculator with Per-prompt and Monthly-plan modes, model rate presets (Sonnet, Opus, GPT-5, Gemini), live pricing from LiteLLM, a side-by-side agent comparison, and per-agent playbooks.
- **Tool Knowledge Base.** Per-tool pages (what, why, token mechanics, adoption order, cached GitHub README).

---

## Quickest start, one Docker container

Run the whole app (frontend, backend, SQLite) in a single container. You only need Docker. No local Python, Node, or database install.

```bash
# from the repo root
docker build -t surgical-ai . && \
docker rm -f surgical-ai-hub 2>/dev/null || true && \
docker run -d --name surgical-ai-hub -p 9999:9999 \
  -v surgical-ai-data:/data \
  surgical-ai
```

Open **http://localhost:9999**.

Inside the container, nginx serves the production React build and proxies `/api` to the FastAPI backend. SQLite stores everything in `/data/app.db`.

**Notes**

- `-v surgical-ai-data:/data` persists the SQLite database (tools catalog, cached GitHub READMEs) across restarts and rebuilds. Without the volume, data is ephemeral. The DB is auto-seeded on every start, so it still works, but you lose any cached READMEs you pulled.
- Multi-arch. Builds and runs on both Apple Silicon (arm64) and Intel/AMD (amd64).
- Tail logs with `docker logs -f surgical-ai-hub`. Stop with `docker stop surgical-ai-hub`.
- The maintenance endpoints are protected by `ADMIN_TOKEN`. Override the default with `-e ADMIN_TOKEN=<long-random-string>` before deploying.

Prefer running the services yourself (for active development with hot reload)? Use the manual setup below.

---

## Desktop installer (coming soon)

Native macOS (`.dmg`) and Windows (`.msi`) installers with in-app auto-update from GitHub Releases are on the roadmap. See [`DESKTOP_INSTALLER.md`](DESKTOP_INSTALLER.md) for the full plan: Tauri plus a Python sidecar, signed `latest.json`, signing requirements, and the release workflow.

---

## Tech Stack

| Layer     | Choice                                                     |
| --------- | ---------------------------------------------------------- |
| Frontend  | React 19 on Vite 8, React Router 7, Tailwind 4, Apple HIG design tokens |
| Viz       | React Flow (`@xyflow/react`)                               |
| Backend   | FastAPI (Python)                                           |
| Database  | SQLite (via `aiosqlite`). Single file, zero setup.         |
| Tokeniser | `gpt-tokenizer` (o200k_base BPE), lazy-loaded in Prompt Builder |
| Pricing   | LiteLLM community price list, proxied and cached by `/api/pricing` |
| GitHub    | GitHub REST API (unauthenticated) via `httpx`, cached in SQLite |

```
.
├── backend/            # FastAPI app
│   ├── server.py       # API entrypoint (app = FastAPI())
│   ├── seed_data.py    # Curated tool content (seeded into SQLite)
│   ├── data/           # SQLite file lives here (gitignored)
│   ├── requirements.txt
│   └── .env            # NOT committed, create locally
├── frontend/           # React app
│   ├── src/
│   ├── package.json
│   └── .env            # NOT committed, create locally
├── docker/             # nginx and supervisor configs for the single-container image
├── Dockerfile
└── DESKTOP_INSTALLER.md
```

---

## Prerequisites

- Python 3.11+ (tested through 3.13. All backend deps ship prebuilt wheels, so no compiler or Rust needed.)
- Node.js 18+ and Yarn (`npm install -g yarn`)
- No database to install. SQLite ships with Python. The DB file is auto-provisioned on first boot.

---

## Database

Surgical AI Hub uses SQLite. There is nothing to install, start, or configure. On first run the backend creates `backend/data/app.db` and seeds it with all seven tools.

- **Location.** Set by `DATABASE_PATH` in `backend/.env`. Defaults to `backend/data/app.db` locally and `/data/app.db` in Docker.
- **Reset.** Stop the backend, delete the file (`rm backend/data/app.db`), restart. Fresh re-seed on next boot.
- **Admin re-seed without stopping.** `POST /api/admin/reseed` with the `X-Admin-Token` header.

---

## 1. Clone

```bash
git clone https://github.com/ayanjitshome/surgical-ai.git
cd surgical-ai
```

## 2. Environment variables

`.env` files are not committed to Git. Create them manually.

**`backend/.env`**

```env
DATABASE_PATH=/absolute/path/to/surgical-ai/backend/data/app.db
CORS_ORIGINS=http://localhost:3000
ADMIN_TOKEN=change-me-to-a-long-random-string
```

| Key             | What it does                                                                                             | Required?                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `DATABASE_PATH` | Absolute path to the SQLite file. The parent directory is auto-created.                                  | Optional. Defaults to `backend/data/app.db` relative to `server.py`.                          |
| `CORS_ORIGINS`  | Comma-separated list of origins allowed by the browser. Use `http://localhost:3000` for local dev.       | Optional. Defaults to `*`. The backend disables cookie credentials, so wildcard is safe.      |
| `ADMIN_TOKEN`   | Required to call the bulk-maintenance endpoints `POST /api/admin/refresh` and `POST /api/admin/reseed`. Pass it as `X-Admin-Token: <value>`. Known placeholders (`change-me`, `admin`, etc.) are rejected at startup. | Optional. If unset, those two endpoints are disabled with a `503`. The per-tool "Refresh from GitHub" button does not need this. |

**`frontend/.env`**

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

The frontend calls `${REACT_APP_BACKEND_URL}/api/...`, so the backend must stay on port `8001` with the `/api` prefix (or you change this value to match).

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

```bash
# Backend, from /backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend, from /frontend (new terminal)
yarn start
```

- Frontend: **http://localhost:3000**
- Backend API: **http://localhost:8001/api**

On first boot the backend auto-seeds all seven tools into SQLite. No manual seed step needed.

---

## API Endpoints (all prefixed with `/api`)

| Method | Path                      | Purpose                                                     |
| ------ | ------------------------- | ----------------------------------------------------------- |
| GET    | `/api/meta`               | Platforms, workflow stages, adoption order                  |
| GET    | `/api/tools`              | All seven tools (adoption order)                            |
| GET    | `/api/tools/{id}`         | Full tool detail                                            |
| GET    | `/api/ecosystem`          | Nodes and edges for the dependency map                      |
| POST   | `/api/decision`           | Rule-based stack recommendation                             |
| GET    | `/api/guidance/tradeoffs` | Tradeoffs and cost playbook                                 |
| GET    | `/api/pricing`            | Live per-1M-token rates (Claude, GPT, Gemini), cached 24 h  |
| POST   | `/api/admin/refresh/{id}` | Fetch and cache one tool's GitHub README (public, rate-limited) |
| POST   | `/api/admin/refresh`      | Refresh all READMEs (requires `X-Admin-Token`)              |
| POST   | `/api/admin/reseed`       | Re-seed tool content (requires `X-Admin-Token`)             |

- GitHub README fetching is unauthenticated, no token required. Use the "Refresh from GitHub" button on a tool page (or the endpoints above).
- `/api/pricing` proxies [LiteLLM's community price list](https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json), maps the latest keys to Claude Sonnet/Opus/Haiku, GPT-5/mini/4o, and Gemini 2.5 Pro, and caches the result in-process for 24 hours. Falls back to hardcoded rates if the upstream is unreachable.

---

## Notes

- Supervisor is only used in the hosted and Docker environments. Locally you just run the two commands above.
- There is no authentication in v1. The only protected routes are the two bulk-maintenance admin endpoints.
- If `yarn start` cannot reach the API, confirm the backend is up on `:8001` and that `CORS_ORIGINS` either includes `http://localhost:3000` or is left as `*`.

### Prose linting

The repo ships a [Vale](https://vale.sh) config at `.vale.ini` that bans em dashes, formulaic transitions, and a short list of AI-slop words from user-facing copy.

```bash
# One-time setup (installs Vale into ~/.local/bin)
./scripts/install-vale.sh

# Run against the whole repo
vale .
```

The rules live under `.vale/styles/SurgicalAI/`. Add project-specific words to `.vale/styles/config/vocabularies/SurgicalAI/accept.txt` so Vale stops flagging them as unknown.

---

## Can the frontend run without the backend?

Short answer: the frontend dev server will start and render the shell, but the app is non-functional without the backend.

Everything the user interacts with is loaded from the API. There is no static or offline fallback. With the backend down:

| Area                                                  | Behaviour with backend OFF                                                                     |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Page shell (sidebar, header, hero text, theme toggle) | ✅ Renders fine, it is static                                                                   |
| **Ecosystem map** (home)                              | ❌ Empty bordered box. It only renders when `/api/ecosystem` returns.                           |
| **Sidebar tool list, stages, platforms**              | ❌ Empty. Populated from `/api/tools` and `/api/meta`.                                          |
| **Tool detail pages**                                 | ❌ Stuck on "Loading tool…". The `/api/tools/{id}` query never resolves.                        |
| **Decision questionnaire**                            | ⚠️ Questions render (they are hardcoded), but **Submit fails**. It POSTs to `/api/decision`.    |
| **Token Economy, Monthly plan**                       | ⚠️ Loads with the hardcoded fallback rates. The "Live prices" chip reports "Built-in rates".    |
| **Prompt Builder**                                    | ✅ Works. The tokeniser is client-side and the agent/tool lists are hardcoded.                  |
| **Search (Cmd+K)**                                    | ⚠️ Opens, but returns no results. The index is built from `/api/tools`.                        |

Why? The frontend has no hardcoded tool metadata. The dependency graph, the recommendation logic, the GitHub READMEs, and the live pricing all live in the backend and SQLite.

To see anything useful, run the backend. If the UI loads but looks empty, the backend is almost certainly down, or `REACT_APP_BACKEND_URL` points at the wrong place.
