# AI Agent Toolkit Hub - PRD

## GitHub Repository
Canonical remote: **https://github.com/ayanjitshome/surgical-ai** (branch: `main`). All future pulls/rebases/pushes target this repo.

## ⚠️ MANDATORY GIT PUSH RULE (owner-mandated)
Every future push to git MUST use this exact identity and flow:
```
git config local user.name "Ayanjit Shome" && \
git config local user.email "ayanjitshome@outlook.com" && \
git add . && \
git commit -m "Your commit message" && \
git push
```
Always set the local user.name/user.email to Ayanjit Shome / ayanjitshome@outlook.com before committing. Note: on this platform the agent itself does not run git push; actual pushes are done by the user via the "Save to Github" feature, which must be configured to use this identity.


## Original Problem Statement

Internal knowledge-product SPA guiding solo devs & small teams to set up and orchestrate six developer tools (Graft, Serena, Graphify, Codebase Memory, Archify, Agentsview) to reduce AI-agent token waste in VSCode. Four core features: Knowledge Base, Guided Setup Wizard, Decision Support Guide, Interactive Ecosystem Dependency Map (React Flow). GitHub README content cached via FastAPI (manual refresh). No auth, no saved state in v1.

## Architecture

- Frontend: React 19 (CRA/craco), React Router, Tailwind, @xyflow/react (React Flow), react-markdown + rehype-raw/sanitize, framer-motion, sonner. **Apple HIG design system** (SF-style typography, system blue, translucent surfaces, hairline separators, soft elevation shadows, 12px radii) with dark/light toggle (ThemeContext, localStorage).
- Backend: FastAPI, **aiosqlite + SQLite** (file at `/app/backend/data/app.db` by default, overridable via `DATABASE_PATH`), httpx for unauthenticated GitHub README fetch. All routes under /api.
- Data: Curated opinionated content in backend/seed_data.py seeded to SQLite on startup; GitHub README cached on top (manual refresh).
- Docker: single-container (nginx + FastAPI + SQLite); no MongoDB. SQLite file persists via volume mount at `/data` (e.g. `-v surgical-ai-data:/data`).

## User Personas

- Solo developer / small team using AI coding agents (Copilot, Claude, Codex, Antigravity) in VSCode across Mac/Windows/WSL/Container/Remote SSH/Corporate.

## Core Requirements (static)

- Per-tool deep-dive knowledge pages with tabs, platform notes, adoption order.
- Guided setup wizard with platform gate, copy-paste commands, validation checkpoints, troubleshooting.
- Rule-based decision questionnaire → recommended stack + reasoning + estimated savings.
- React Flow ecosystem map with node inspector drawer and pipeline layers.
- Sidebar nav (tool/stage/platform), client-side search (Cmd+K), responsive.
- GitHub content cached, manually refreshed. No auth.

## Implemented (2026-06)

### 2026-10-29 (SQLite migration + Apple HIG + Token Economy)
- **Database migration**: MongoDB → SQLite via `aiosqlite`. Single `tools` table (scalar columns + JSON `data` blob). Env: `DATABASE_PATH` (defaults to `backend/data/app.db`). Dockerfile drops MongoDB apt install; supervisor drops `mongod` program; `VOLUME /data` for persistence.
- **Apple HIG design pass** across every page: SF Pro / Inter typography stack, system blue (`#0A84FF` dark / `#007AFF` light) as primary, translucent sidebar/header (`backdrop-blur`), hairline separators, 12px radii, soft elevation shadows, HIG stat/chip/button utilities (`hig-card`, `hig-btn`, `hig-chip`, `hig-title-*`). Removed hard dot-grid for soft radial brand wash. Removed heavy `font-mono` from headings/eyebrows (kept in code blocks and status lines).
- **Token Economy module** (`/tokeneconomy`): interactive calculator (input tokens, cached %, output tokens, prompts/hour → effective cost, savings vs no-cache, 5-hour drain), tabbed sections (Caching · Conversation Habits · CLI & IDE · Output Traps), per-agent accordion for Claude/Copilot/Codex/Antigravity + generic agent. All content adapted to be agent-agnostic.
- Sidebar: fixed duplicate `data-testid` on Token Economy link; new coin icon.
- All API endpoints preserved (same shape, same auth). Admin token enforcement, per-tool refresh rate limit, CORS, attribution headers all intact.

### Earlier backend endpoints:
- Backend endpoints: /api/meta, /api/tools, /api/tools/{id}, /api/ecosystem, /api/decision (Literal-validated), /api/guidance/tradeoffs, /api/admin/refresh/{id}, /api/admin/refresh, /api/admin/reseed.
- Full curated content for all 6 tools (overview, mechanics, adoption note, 6 platform notes, 3 setup steps each with validation + troubleshooting, platform-specific install overrides).
- Ecosystem map (React Flow) with 6 nodes, 8 dependency edges, 4 layers, animated edges, node drawer, minimap, theme-aware explicit colors.
- Knowledge base tool detail with 5 tabs incl. GitHub README (rehype-raw/sanitize render) + manual refresh.
- Guided wizard: platform gate, stepper, platform-adaptive commands + tips, copy blocks, verify checkpoints, troubleshooting drawer, completion screen.
- Decision questionnaire (5 steps) → recommendation result with savings + per-tool reasoning + CTAs.
- Guidance page: adoption order timeline, tradeoff comparisons, cost playbook table.
- Platform view + Stage view pages, search modal, dark/light toggle.
- Verified via testing agent (iteration_1): no critical issues; 4 minor issues all fixed (enum validation, README HTML rendering, platform-specific wizard content, extra data-testids).

## Backlog / Remaining

- P1: Scheduled automatic GitHub refresh (currently manual only, per spec).
- P2: Full per-step (not just install step) platform-specific commands for every tool.
- P2: Deeper tradeoff matrix views; cost savings calculator with numeric inputs.
- P2: Richer README rendering (relative image/link resolution to GitHub raw).

## Next Tasks

- Optional: add a daily cron to refresh GitHub content.

## 2026-06 - Security & Accessibility hardening

Security (audit: conditional pass; XSS sanitized, SSRF not user-controlled, NoSQL safe):

- SEC-001: removed default admin token from docker/supervisord.conf; server.py now rejects known placeholder tokens at startup (admin endpoints disabled until a strong ADMIN_TOKEN is injected).
- SEC-002: Docker CORS no longer wildcard (same-origin container).
- SEC-003: nginx.conf now sets X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy.
Accessibility (WCAG 2.2 AA, all applied):
- Accessible names on all icon-only buttons (sidebar/theme/search-close/drawer-close).
- Skip-to-content link; main landmark id+tabindex; nav/aside aria-labels.
- Search modal & node drawer are dialogs with Escape + focus trap/restore (search modal).
- Visible :focus-visible outlines; search input labelled.
- Dark-mode muted text lightened #64748B -> #8B97AA for 4.5:1 contrast.
- PromptBuilder form labels associated (htmlFor/id) + role=group for button groups; aria-pressed on toggles.
- ToolDetail tabs use ARIA tab pattern (tablist/tab/tabpanel + arrow/Home/End keys).
- Decide progress bar role=progressbar; options aria-pressed.
Verified: backend restart + curl (tools 200, admin refresh/reseed 401 without token), frontend compiles, home smoke screenshot. User to self-verify in browser.

## 2026-06 - Code quality (SonarQube-equivalent static analysis)

Tooling used (no Sonar server in env): ESLint v9 (react/react-hooks/jsx-a11y), Ruff, Flake8.
Backend (ruff real-smell set F,B,C90,SIM,UP,RUF,E7xx now fully clean):

- Removed unused local var `agent` in seed_data.decision_recommendation (F841 reliability smell).
- Modernized deprecated typing in server.py: List/Dict/Optional -> list/dict/X | None.
Frontend (ESLint 0 errors on src, ui/ excluded as vendored):
- Removed 5 unused imports (Sidebar Layers, Home cn, PlatformView ArrowRight, PromptBuilder TOOL_DIRECTIVES+BookMarked) and 1 unused vendor const (use-toast actionTypes) - S1128/S1481.
- a11y: ecosystem ToolNode now keyboard-operable (role=button, tabIndex, Enter/Space); ToolDetail tab keyboard handler moved from tablist to tabs (interactive-supports-focus).
- Fixed react/no-unescaped-entities (apostrophes/quotes) and react/jsx-no-comment-textnodes (wrapped "// ..." labels in braces).
Not changed: E501 long-line warnings remain only on seed_data.py content/data string literals (intentional data; not reflowed to avoid altering content). Verified: linters clean, frontend compiles, /api/tools 200, decision engine + 7-node ecosystem intact, Prompt Builder smoke screenshot clean.

## 2026-06 - Copyright protection & attribution (Concept by Ayanjit Shome)

Owner wants hard-to-remove authorship attribution + legal artifacts.

- LICENSE: proprietary copyright license at /app/LICENSE (© 2026 Ayanjit Shome, attribution-retention clause).
- Source headers: "© 2026 Ayanjit Shome ... Concept by Ayanjit Shome" prepended to all frontend src JS/JSX (excl components/ui vendored) and backend .py.
- Frontend runtime guard (/app/frontend/src/lib/integrity.js, imported in index.js + App.js): bottom-right badge, name stored as char codes (not plaintext in bundle), MutationObserver + 1.5s interval self-heal on removal/text tamper, console attribution, escalates to full-screen notice + blur #root after 6 forced removals. Verified: badge renders bottom-right and self-heals after deletion.
- HTML markers (index.html): meta author + copyright, html[data-author], #root[data-author], HTML comment.
- Backend: AUTHOR/COPYRIGHT constants, X-Author/X-Copyright response headers (middleware), author+copyright fields in /api/ and /api/meta, startup log banner. Verified via curl.
Caveat: deters casual removal; a determined dev editing source can still strip the guard - LICENSE + headers are the legal backstop.


## 2026-10 - Expanded model coverage from LiteLLM registry

Token Economy picker widened from 4 models to the full set the user requested, all resolving live from `model_prices_and_context_window.json` (32 live / 0 fallback on the first refresh):

- Anthropic (13): Claude Opus 5.5, 5, 4.8, 4.7, 4.6, 4.5; Sonnet 5.5, 5, 4.6; Haiku 5.5, 4.5; Fable 5, Fable 5.1
- OpenAI (13): GPT-5 Codex, 5.1 Codex, 5.2 Codex, 5.3 Codex; GPT-5, 5.1, 5.2, 5.5, 5.6 Terra; GPT-6 Sol, Luna, Astra, 6.1 Terra
- Google (6): Gemini 3.1 Pro, 3 Flash, 3.5 Flash, 3.8 Flash, 4 Argon, 2.5 Pro

Backend (`server.py`): `_MODEL_LOOKUPS` rewritten with candidate keys per model, fallback rates derived from the current LiteLLM entries.
Shared math (`lib/scenario.js`): `FALLBACK_MODELS` + `DEFAULTS.modelId` updated to match, default is `claude-sonnet-5-5`.
UI (`TokenEconomy.jsx`): `ModelPicker` component - vendor filter chips (All / Anthropic / OpenAI / Google / You) above a searchable, `optgroup`-grouped dropdown.
Pricing refresh endpoint is public (`POST /api/pricing/refresh`), the old `/api/admin/pricing/refresh` route was removed.


## 2026-10 - Security sweep and dead-code cleanup

Full audit + prune pass. Everything stays within existing majors, no breaking changes.

**Security:** reduced `yarn audit` findings from 50 (2 Critical / 16 High / 21 Moderate / 11 Low) to **5 Low**.
- Bumped direct: `axios` to the latest 1.x.
- Added `resolutions` for react-scripts transitives: `body-parser`, `fast-uri`, `follow-redirects`, `launch-editor`, `postcss-selector-parser`, `qs`, `shell-quote`, `svgo`.
- Backend `pip-audit`: no known vulnerabilities.

**Dead code removed:**
- Unused app libraries: `@hookform/resolvers`, `cra-template`, `dayjs`, `framer-motion`, `lodash`, `recharts`, `swr`, `zod`, `@types/lodash`.
- Unused dev tooling (no lint config exists): `eslint`, `@eslint/js`, `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `globals`, `@babel/plugin-proposal-private-property-in-object`.
- Shadcn UI kit pruned to only the components actually used in src (`sonner.jsx`); 45 unused primitives removed.
- `src/hooks/use-toast.js` removed (orphan).
- `craco.config.js`: deleted the `@emergentbase/overlay` and `@emergentbase/visual-edits` require-and-wrap branches (packages were already uninstalled; the `require()` calls were silently failing). `isDevServer` constant dropped too.

**Verified:** `/`, `/decide`, `/guidance`, `/prompt`, `/prompt/builder`, `/tokeneconomy` all render with the shared header, zero page errors. Backend `/api/tools` and `/api/pricing/refresh` return healthy payloads. Vale lint still passes across all 33 source files.

## 2026-10 - Bundler migration + full "latest" upgrade

User asked for every package on absolute latest, with code adapted around any breaking change. CRA cannot run Tailwind v4, so the toolchain itself moved.

**New bundler**: Create React App + CRACO replaced by **Vite 8** + `@vitejs/plugin-react` + `@tailwindcss/vite`.
- `craco.config.js`, `postcss.config.js`, `public/index.html` deleted.
- New files: `vite.config.js`, `index.html` at project root, `src/main.jsx` (renamed from `src/index.js`), `src/App.jsx` (renamed from `src/App.js` so Vite's react plugin picks up the JSX).
- `package.json` now has `"type": "module"`, scripts are `vite` / `vite build` / `vite preview`.
- `vite.config.js` sets `envPrefix: ["REACT_APP_", "VITE_"]` so the system contract (`REACT_APP_BACKEND_URL`) keeps working, and binds dev server to `0.0.0.0:3000` with `allowedHosts: true` for the Kubernetes ingress.
- All `process.env.REACT_APP_BACKEND_URL` reads migrated to `import.meta.env.REACT_APP_BACKEND_URL` (4 files).

**Tailwind v3 → v4**:
- `tailwindcss@4`, `@tailwindcss/vite@4`.
- `src/index.css` now uses `@import "tailwindcss"; @import "tw-animate-css"; @config "../tailwind.config.js";`.
- Replaced the deprecated `tailwindcss-animate` plugin with `tw-animate-css`.
- Added a base layer that pins `border-color` back to `gray-200` so v4's new `currentColor` default does not drift the UI.

**lucide-react 0.516 → 1.64**:
- v1 removed brand icons for trademark reasons. Replaced the `Github` import with a shared inline Octocat SVG at `src/components/BrandIcons.jsx`, consumed by `Header.jsx` and `ToolDetail.jsx`.

**Also upgraded within the current major** (patch + minor only, no behavior changes needed): `react` 19.3.1, `react-dom` 19.3.1, `react-router-dom` 7.18.5, `@tanstack/react-query` 5.105, `sonner` 2.0.8, `tailwind-merge` 3.7, `gpt-tokenizer` 4.1, `axios` latest 1.x, plus Vite plugins.

**Second dead-code pass** (consumers were removed in the previous cleanup): dropped all 27 `@radix-ui/*` primitives, `class-variance-authority`, `cmdk`, `date-fns`, `embla-carousel-react`, `input-otp`, `react-day-picker`, `react-hook-form`, `react-resizable-panels`, `vaul`, plus `autoprefixer`, `postcss`, `dotenv` (dev) now that CRACO is gone.

**Numbers**: dependencies went from 50+ to **15 runtime + 5 dev**. `yarn audit` findings went from the original 50 (2 Critical / 16 High / 21 Moderate / 11 Low) to **0 vulnerabilities**. `yarn build` produces a 1.5 kB index + 1 MB JS bundle in ~1 s. All six main routes render with the shared header, Monthly plan mode of Token Economy still lists all 33 live models, and Vale lint stays clean across 34 source files.


## 2026-10 - "Risk & Reward" page

New page at `/risk-reward`, linked from the sidebar as **Risk & Reward**. Three sections:

1. **Four concern cards**: Cost Management, Codebase Visibility, Rigorous Validation Overhead, Critical Thinking Retention. Each has an icon tile, one-line hook, two-sentence body, and three concrete "watch for" signals.
2. **Diminishing Returns chart**: hand-rolled inline SVG, dual-axis. Time Saved (blue, left axis in hours) overlaid with Risk Index (red, right axis 0-100) across 20-120 mph. Visitors drag a slider to anchor a vertical marker; three readouts update live (time saved, risk, verdict). A "Sweet spot" annotation sits at 70 mph, a soft red wash marks the 85-120 mph cliff zone.
3. **Task Delegation Matrix**: 2x2 grid of Manual vs AI against Low vs High complexity. The inverse of the usual advice is encoded in colour: green "Keep sharp" (manual, low) and green "Optimal AI use" (AI, high), with amber on the other diagonal. Each quadrant lists 3 concrete coding examples.

Files added:
- `src/pages/RiskReward.jsx` (page composition + three section components)
- `src/components/BrandIcons.jsx` was already in place from the lucide v1 migration

Routing + nav:
- `src/App.jsx` registers `/risk-reward`.
- `src/Sidebar.jsx` adds a `Gauge`-icon NavLink in red (`#FF453A`) that fits the "safety" palette of the page.

Zero new dependencies. All content lint-clean through Vale.


## 2026-10 - Ecosystem map control glyphs visible in dark mode

`index.css` extended so the three default React Flow control buttons (zoom in, zoom out, fit view) pick up the current theme's `--text-secondary` token on their nested `<path>` fills, matching the custom Fullscreen button. Hover lifts to `--text-primary`. CSS-only change, no React Flow or theme-context edits.
