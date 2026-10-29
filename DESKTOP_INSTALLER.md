# Desktop Installer — Planning Doc

Native **macOS (.dmg)** and **Windows (.msi)** installers for Surgical AI Hub, with in-app auto-update from GitHub Releases. **This is a plan, not yet implemented.**

---

## Context

Surgical AI Hub today is a 3-piece web stack:

- React SPA (CRA build)
- FastAPI backend (data, GitHub proxy, `/api/pricing` proxy)
- SQLite file at `backend/data/app.db`

Making it installable means shipping that stack as a native app with a Mac installer, a Windows installer, and in-app updates from GitHub Releases.

---

## Three realistic approaches

### Option A — Tauri 2 + Python sidecar  ⭐ recommended

Native shell written in Rust that renders the React build inside the OS webview (WKWebView on macOS, WebView2 on Windows) and runs the FastAPI backend as a bundled sidecar.

- **Installer size:** ~15–30 MB (webview is OS-native, no Chromium)
- **Memory:** 60–100 MB idle (vs Electron's 200+)
- **Auto-update:** first-class, built into Tauri's updater plugin. Reads a signed `latest.json` from GitHub Releases, verifies a Minisign signature, downloads and applies in-place.
- **Code signing:** Apple Developer ID + notarization for Mac; EV/OV certificate for Windows SmartScreen reputation.
- **Backend reuse:** FastAPI runs unchanged on `127.0.0.1:<random>`, SQLite lives in the OS app-data folder (`~/Library/Application Support/SurgicalAIHub` / `%APPDATA%\SurgicalAIHub`).

**Risks:** Python sidecar packaging (via `pyinstaller`) is the fiddly bit — ~10 MB extra, needs per-platform build matrix.

### Option B — Electron + Python sidecar

Same architecture, battle-tested tooling (`electron-builder`, `electron-updater`), but ships Chromium.

- **Installer size:** 90–150 MB
- **Memory:** 200–400 MB idle
- **Auto-update:** `electron-updater` → GitHub Releases, extremely mature
- **Upside:** fastest ramp, every edge case has been hit before. If size doesn't matter, this is the lowest-risk path.

### Option C — Pure web shell (SQLite in-browser)

Rewrite the DB layer to use `sql.js` or `wa-sqlite` + OPFS persistence, drop the Python backend, keep only a tiny proxy service (or move GitHub/LiteLLM fetches to a cron that commits JSON to the repo). Then wrap the whole SPA in Tauri or even just ship as a PWA.

- **Installer size:** 5–10 MB
- **Memory:** ~50 MB
- **Trade-off:** 2–3 days of refactor to port `/api/*` endpoints to in-browser logic; loses the Python server as a future expansion point.
- **Bonus:** trivial auto-update (just replace the webview assets).

---

## Recommendation

**Option A (Tauri + Python sidecar)** is the right balance for Surgical AI Hub today — small installer, native feel, keeps existing FastAPI logic, and Tauri's updater works cleanly with the GitHub Releases flow.

---

## Architecture changes implied

1. **Frontend**
   - Switch `REACT_APP_BACKEND_URL` to point to `http://127.0.0.1:<port>` at runtime (Tauri injects the port via a bootstrap script).
   - Keep CRA build as-is; Tauri just copies `frontend/build/` into the bundle.

2. **Backend**
   - Add a `main.py` entry that reads a port from CLI args, writes the chosen port to a handshake file, then starts uvicorn on `127.0.0.1`.
   - Package with `pyinstaller --onefile` per platform (Mac universal + Windows x64).
   - SQLite path becomes `app.getPath('userData')` equivalent (via Tauri → env var).
   - Keep the `/api/pricing` and GitHub README proxy — same code, different host.

3. **Shell project** (`/app/desktop/`)
   - `src-tauri/` with `tauri.conf.json`, a Rust `main.rs` that spawns the Python sidecar and waits for the handshake.
   - Bundled Python binary goes in `src-tauri/binaries/surgical-ai-backend-<target>`.

4. **CI/CD** (`.github/workflows/release.yml`)
   - Matrix build on `macos-latest` and `windows-latest`.
   - Step 1: `yarn build` the SPA.
   - Step 2: `pyinstaller` the backend.
   - Step 3: `tauri build` → `.dmg` + `.msi`.
   - Step 4: sign + notarize.
   - Step 5: upload artifacts + signed `latest.json` to the GitHub Release.

---

## Signing & notarization (not optional)

| Platform | What you need                                  | Cost / year | Why it matters                                                                                 |
| -------- | ---------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| macOS    | Apple Developer ID + `notarytool`              | $99         | Without it, Gatekeeper shows "unidentified developer" and users must right-click → Open.       |
| Windows  | OV code-signing cert (Sectigo, DigiCert) or EV | $70–400     | Without it, SmartScreen blocks the installer by default; EV builds reputation instantly.      |

An unsigned build still *works* but every user hits a scary warning on first run.

---

## Auto-update flow (Tauri)

1. On app start, Tauri calls `GET https://github.com/ayanjitshome/surgical-ai/releases/latest/download/latest.json`.
2. `latest.json` carries version + platform-specific download URLs + a Minisign signature.
3. If the running version is older, Tauri shows an in-app "Update available" prompt (customisable UI).
4. On accept, Tauri downloads the delta, verifies the signature with the public key compiled into the app binary, and applies on next restart.
5. All of this is a few lines of config + the updater plugin — no custom update server needed.

Rollback story: ship a "Reinstall previous version" link on the website; Tauri doesn't do native rollback.

---

## Release workflow (end-to-end)

```
git tag v1.2.0  →  GitHub Actions matrix
                     ├─ macOS:   build SPA + PyInstaller + tauri build + notarize → .dmg
                     └─ Windows: build SPA + PyInstaller + tauri build + sign     → .msi
                   Attach .dmg + .msi + latest.json (signed) to the Release
                   Live users auto-check within ~24h and prompt to update
```

---

## Open decisions required before implementation

1. **Auto-update prompt style** — silent background apply, or always ask the user?
2. **macOS target** — Apple Silicon only, or universal (bigger, slower CI, happier Intel owners)?
3. **Windows SmartScreen** — OV cert (~$70, 1–2 week reputation ramp) or EV (~$300, instant trust)?
4. **Data migration** — if someone was running the Docker build before, do we offer to import their old `app.db`?
5. **Offline-first vs online-required** — the pricing / GitHub README refresh needs internet; is that acceptable, or do we need "fully works offline" with longer cache TTLs?

---

## Rough effort estimate

| Phase                                                                                | Effort                               |
| ------------------------------------------------------------------------------------ | ------------------------------------ |
| Tauri shell + Python sidecar wiring                                                  | 1 day                                |
| CI matrix (Mac + Windows)                                                            | 1 day                                |
| Auto-updater config + signed `latest.json`                                           | ½ day                                |
| Signing setup (code is quick; **cert procurement is the long pole**)                 | ½ day of code, 1–2 weeks for certs   |
| Install UX polish (first-run, update prompt, menu-bar icon)                          | 1 day                                |
| **Total engineering**                                                                | **~4 days** once certs are in hand   |

---

_Status: planning only. No desktop-shell code or CI workflow has been added to the repo yet._
