# AI Agent Toolkit Hub — PRD

## Original Problem Statement
Internal knowledge-product SPA guiding solo devs & small teams to set up and orchestrate six developer tools (Graft, Serena, Graphify, Codebase Memory, Archify, Agentsview) to reduce AI-agent token waste in VSCode. Four core features: Knowledge Base, Guided Setup Wizard, Decision Support Guide, Interactive Ecosystem Dependency Map (React Flow). GitHub README content cached via FastAPI (manual refresh). No auth, no saved state in v1.

## Architecture
- Frontend: React 19 (CRA/craco), React Router, Tailwind, @xyflow/react (React Flow), react-markdown + rehype-raw/sanitize, framer-motion, sonner. Dark-default terminal/docs hybrid theme with light toggle (ThemeContext, localStorage).
- Backend: FastAPI, Motor/MongoDB, httpx for unauthenticated GitHub README fetch. All routes under /api.
- Data: Curated opinionated content in backend/seed_data.py seeded to MongoDB on startup; GitHub README cached on top (manual refresh).

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
- Optional: expand platform overrides to config/serve steps.

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
