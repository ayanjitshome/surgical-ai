# Desktop Installer, Planning Doc

Native macOS (`.dmg`) and Windows (`.msi`) installers for Surgical AI Hub, with in-app auto-update from GitHub Releases. This is a plan, not yet implemented.

---

## Context

Surgical AI Hub is a 3-piece web stack today:

- React SPA (CRA build)
- FastAPI backend (data, GitHub proxy, `/api/pricing` proxy)
- SQLite file at `backend/data/app.db`

Making it installable means shipping that stack as a native app with a Mac installer, a Windows installer, and in-app updates from GitHub Releases.

---

## Three realistic approaches

### Option A, Tauri 2 plus a Python sidecar (recommended)

Native shell written in Rust that renders the React build inside the OS webview (WKWebView on macOS, WebView2 on Windows), and runs the FastAPI backend as a bundled sidecar.

- Installer size: 15 to 30 MB (webview is OS-native, no Chromium).
- Memory: 60 to 100 MB idle (vs Electron's 200+).
- Auto-update: first-class, built into Tauri's updater plugin. Reads a signed `latest.json` from GitHub Releases, verifies a Minisign signature, downloads, and applies in place.
- Code signing: Apple Developer ID plus notarization for Mac. EV or OV certificate for Windows SmartScreen reputation.
- Backend reuse: FastAPI runs unchanged on `127.0.0.1:<random>`. SQLite lives in the OS app-data folder (`~/Library/Application Support/SurgicalAIHub` or `%APPDATA%\SurgicalAIHub`).

Risks: Python sidecar packaging (via `pyinstaller`) is the fiddly bit. About 10 MB extra, and needs a per-platform build matrix.

### Option B, Electron plus a Python sidecar

Same architecture, battle-tested tooling (`electron-builder`, `electron-updater`), but ships Chromium.

- Installer size: 90 to 150 MB.
- Memory: 200 to 400 MB idle.
- Auto-update: `electron-updater` to GitHub Releases, very mature.
- Upside: fastest ramp, every edge case has been hit before. If size does not matter, this is the lowest-risk path.

### Option C, pure web shell (SQLite in-browser)

Rewrite the DB layer to use `sql.js` or `wa-sqlite` with OPFS persistence. Drop the Python backend. Keep only a tiny proxy service (or move GitHub and LiteLLM fetches to a cron that commits JSON to the repo). Then wrap the SPA in Tauri, or even just ship as a PWA.

- Installer size: 5 to 10 MB.
- Memory: around 50 MB.
- Trade-off: 2 to 3 days of refactor to port the `/api/*` endpoints to in-browser logic. Loses the Python server as a future expansion point.
- Bonus: trivial auto-update (just replace the webview assets).

---

## Recommendation

Option A (Tauri with a Python sidecar) is the right balance for Surgical AI Hub today. Small installer, native feel, keeps the existing FastAPI logic, and Tauri's updater works cleanly with the GitHub Releases flow.

---

## Architecture changes implied

1. **Frontend**
   - Point `REACT_APP_BACKEND_URL` at `http://127.0.0.1:<port>` at runtime (Tauri injects the port via a bootstrap script).
   - Keep the CRA build as-is. Tauri just copies `frontend/build/` into the bundle.

2. **Backend**
   - Add a `main.py` entry that reads a port from CLI args, writes the chosen port to a handshake file, then starts uvicorn on `127.0.0.1`.
   - Package with `pyinstaller --onefile` per platform (Mac universal, Windows x64).
   - SQLite path becomes the `app.getPath('userData')` equivalent (via Tauri, through an env var).
   - Keep `/api/pricing` and the GitHub README proxy. Same code, different host.

3. **Shell project** (`/app/desktop/`)
   - `src-tauri/` with `tauri.conf.json`, and a Rust `main.rs` that spawns the Python sidecar and waits for the handshake.
   - Bundled Python binary goes in `src-tauri/binaries/surgical-ai-backend-<target>`.

4. **CI/CD** (`.github/workflows/release.yml`)
   - Matrix build on `macos-latest` and `windows-latest`.
   - Step 1: `yarn build` the SPA.
   - Step 2: `pyinstaller` the backend.
   - Step 3: `tauri build` to produce `.dmg` and `.msi`.
   - Step 4: sign and notarize.
   - Step 5: upload artifacts and a signed `latest.json` to the GitHub Release.

---

## Signing and notarization (not optional)

| Platform | What you need                                  | Cost / year | Why it matters                                                                                 |
| -------- | ---------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| macOS    | Apple Developer ID plus `notarytool`           | $99         | Without it, Gatekeeper shows "unidentified developer", and users have to right-click, Open.    |
| Windows  | OV code-signing cert (Sectigo, DigiCert), or EV | $70 to 400  | Without it, SmartScreen blocks the installer by default. EV builds reputation instantly.      |

An unsigned build still works, but every user hits a scary warning on first run.

---

## Auto-update flow (Tauri)

1. On app start, Tauri calls `GET https://github.com/ayanjitshome/surgical-ai/releases/latest/download/latest.json`.
2. `latest.json` carries the version, platform-specific download URLs, and a Minisign signature.
3. If the running version is older, Tauri shows an in-app "Update available" prompt (UI is customisable).
4. On accept, Tauri downloads the delta, verifies the signature with the public key compiled into the app binary, and applies on next restart.
5. All of this is a few lines of config and the updater plugin. No custom update server needed.

Rollback story: ship a "Reinstall previous version" link on the website. Tauri does not do native rollback.

---

## Release workflow, end to end

```
git tag v1.2.0  ->  GitHub Actions matrix
                     - macOS:   build SPA + PyInstaller + tauri build + notarize -> .dmg
                     - Windows: build SPA + PyInstaller + tauri build + sign     -> .msi
                   Attach .dmg + .msi + latest.json (signed) to the Release.
                   Live users auto-check within ~24h and see the update prompt.
```

---

## Open decisions needed before implementation

1. **Auto-update prompt style.** Silent background apply, or always ask the user?
2. **macOS target.** Apple Silicon only, or universal (bigger bundle, slower CI, happier Intel owners)?
3. **Windows SmartScreen.** OV cert (around $70, 1 to 2 weeks of reputation ramp), or EV (around $300, instant trust)?
4. **Data migration.** If someone was running the Docker build before, do we offer to import their old `app.db`?
5. **Offline-first vs online-required.** The pricing and GitHub README refresh need internet. Is that acceptable, or do we need "fully works offline" with longer cache TTLs?

---

## Rough effort estimate

| Phase                                                                                | Effort                                       |
| ------------------------------------------------------------------------------------ | -------------------------------------------- |
| Tauri shell plus Python sidecar wiring                                               | 1 day                                        |
| CI matrix (Mac and Windows)                                                          | 1 day                                        |
| Auto-updater config plus signed `latest.json`                                        | ½ day                                        |
| Signing setup (code is quick, cert procurement is the long pole)                     | ½ day of code, 1 to 2 weeks for certs        |
| Install UX polish (first-run, update prompt, menu-bar icon)                          | 1 day                                        |
| **Total engineering**                                                                | About 4 days once certs are in hand          |

---

_Status: planning only. No desktop-shell code or CI workflow has been added to the repo yet._
