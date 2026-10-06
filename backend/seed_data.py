"""Curated, opinionated seed content for the Surgical AI tools.

This is the source of truth for tool metadata, deep-dive content, platform
notes, guided setup steps, validation checkpoints and troubleshooting. GitHub
README markdown is fetched and cached on top of this at runtime.
"""

PLATFORMS = [
    {"id": "mac", "name": "macOS", "icon": "apple"},
    {"id": "windows", "name": "Windows", "icon": "windows"},
    {"id": "wsl", "name": "WSL", "icon": "terminal"},
    {"id": "container", "name": "Container", "icon": "box"},
    {"id": "remote-ssh", "name": "Remote SSH", "icon": "server"},
    {"id": "corporate", "name": "Corporate", "icon": "shield"},
]

WORKFLOW_STAGES = [
    {"id": "filesystem", "name": "Filesystem", "order": 1,
     "description": "Decides which files ever reach the agent."},
    {"id": "context-governor", "name": "Context Governor", "order": 2,
     "description": "Budgets, throttles and enforces what enters the prompt window."},
    {"id": "structural-graph", "name": "Structural Graph", "order": 3,
     "description": "Maps code structure and persistent repo memory."},
    {"id": "output-governor", "name": "Output Governor", "order": 4,
     "description": "Governs what the agent actually writes, enforcing minimalism so less code is generated."},
    {"id": "agent-interface", "name": "Agent Interface", "order": 5,
     "description": "Surfaces everything inside the VSCode agent experience."},
]

# Adoption order derived from dependency layers (Ponytail first: zero-infra behavioral win)
ADOPTION_ORDER = ["ponytail", "graft", "serena", "graphify", "codebase-memory", "archify", "agentsview"]

ECOSYSTEM_EDGES = [
    {"id": "e-graft-serena", "source": "graft", "target": "serena",
     "label": "filtered file tree"},
    {"id": "e-graft-graphify", "source": "graft", "target": "graphify",
     "label": "scoped files to parse"},
    {"id": "e-serena-archify", "source": "serena", "target": "archify",
     "label": "budgeted window"},
    {"id": "e-serena-ponytail", "source": "serena", "target": "ponytail",
     "label": "budgeted window"},
    {"id": "e-ponytail-agentsview", "source": "ponytail", "target": "agentsview",
     "label": "leaner diffs"},
    {"id": "e-graphify-codebase-memory", "source": "graphify", "target": "codebase-memory",
     "label": "symbol graph"},
    {"id": "e-graphify-archify", "source": "graphify", "target": "archify",
     "label": "structural facts"},
    {"id": "e-codebase-memory-agentsview", "source": "codebase-memory", "target": "agentsview",
     "label": "retrieved context"},
    {"id": "e-archify-agentsview", "source": "archify", "target": "agentsview",
     "label": "invariant checks"},
    {"id": "e-serena-agentsview", "source": "serena", "target": "agentsview",
     "label": "token telemetry"},
]


def _steps_generic(tool_name, pkg, cmd):
    """A reasonable default 4-step setup used as a base per tool."""
    return []


TOOLS = [
    {
        "id": "graft",
        "name": "Graft",
        "layer": "filesystem",
        "layer_name": "Filesystem",
        "layer_order": 1,
        "tagline": "Surgical context slicing & file-tree filtering",
        "token_waste_reduction": "35-45%",
        "color": "#10B981",
        "github_repo": "https://github.com/trailhq/Graft",
        "github_owner": "trailhq",
        "github_name": "Graft",
        "stats": {"token_saved": "35-45%", "latency": "-28%", "setup_time": "~6 min"},
        "overview": """**Graft** is the foundation layer. Before your AI agent reads a single line of code, Graft decides *which* files it is even allowed to see.

Most agents waste tokens because they ingest the entire workspace - `node_modules`, build artifacts, lockfiles, generated code, vendored dependencies. Graft sits at the filesystem boundary and grafts a **surgical slice** of your repository onto the agent's view, driven by declarative include/exclude rules and relevance heuristics.

### Why it matters
- Agents routinely burn 40%+ of their context window on files that have zero bearing on the task.
- Graft produces a deterministic, cacheable file tree so the same task always starts from the same slice.
- It is the cleanest single win for token cost: filtering happens *before* embedding, parsing or prompting.""",
        "mechanics": """### How Graft reduces token waste

1. **Pre-ingestion filtering** - rules are applied at the filesystem layer, so excluded files never get read, hashed or embedded. The savings compound downstream.
2. **Relevance scoring** - Graft ranks files by recency, import-graph proximity to the open file, and task keywords, then keeps only the top slice that fits a configurable budget.
3. **Deterministic slices** - the same prompt yields the same graft, which makes responses cacheable and reduces redundant re-reads.

> Rule of thumb: on a typical polyglot repo, Graft removes ~40% of tokens *before* any other tool runs. Everything layered on top inherits that reduction.""",
        "adoption_note": "Install Graft **first**. It is the filesystem foundation every other tool reads from - a stable graft makes Graphify's parse scope smaller and Serena's budgeting more accurate.",
        "platform_notes": {
            "mac": "Works natively. Install via Homebrew. Grant Full Disk Access to VSCode if grafting files outside the workspace root.",
            "windows": "Use the native Windows build. Path separators are handled automatically, but prefer forward slashes in `.graftrc` glob patterns.",
            "wsl": "Install inside the WSL distro, not Windows. Keep your repo on the Linux filesystem (`~/project`, not `/mnt/c/...`) or file-watch performance collapses.",
            "container": "Add the Graft binary to your Dockerfile and mount `.graftrc` as part of the image. Disable the file-watcher daemon; run graft in one-shot mode on container start.",
            "remote-ssh": "Install Graft on the remote host. The VSCode Remote-SSH extension runs the server remotely, so the graft must execute there too - a local install does nothing.",
            "corporate": "Fully offline-capable. No network calls required for core grafting. If your security team blocks unsigned binaries, build from source with the provided checksum.",
        },
        "setup_steps": [
            {
                "title": "Install the Graft CLI",
                "description": "Install Graft globally so it is available to the VSCode agent runtime.",
                "commands": ["npm install -g @trailhq/graft"],
                "snippet": "",
                "validation": {"command": "graft --version", "expected": "Prints a semver like 1.x.x without errors."},
                "troubleshooting": [
                    {"problem": "`command not found: graft`", "solution": "Your global npm bin is not on PATH. Run `npm bin -g` and add that directory to your shell profile."},
                ],
            },
            {
                "title": "Initialize a graft config",
                "description": "Create a `.graftrc` at the repo root describing what the agent may see.",
                "commands": ["graft init"],
                "snippet": """{
  "include": ["src/**", "lib/**", "*.md"],
  "exclude": ["**/node_modules/**", "**/dist/**", "**/*.lock"],
  "budget": { "maxFiles": 120, "maxTokens": 60000 }
}""",
                "validation": {"command": "graft plan", "expected": "A table of included files well under your maxTokens budget."},
                "troubleshooting": [
                    {"problem": "Too many files still included", "solution": "Tighten `exclude` globs and lower `budget.maxFiles`. Run `graft plan --explain` to see why each file was kept."},
                ],
            },
            {
                "title": "Wire Graft into the agent",
                "description": "Point your VSCode agent at the graft slice instead of the raw workspace.",
                "commands": ["graft serve --port 7801"],
                "snippet": """// .vscode/settings.json
{
  "aiAgent.contextProvider": "http://localhost:7801/graft"
}""",
                "validation": {"command": "curl -s localhost:7801/health", "expected": '{"status":"ok"} and a non-zero file count.'},
                "troubleshooting": [
                    {"problem": "Agent still reads excluded files", "solution": "The agent is bypassing the provider. Confirm `aiAgent.contextProvider` is set and reload the VSCode window."},
                ],
            },
        ],
    },
    {
        "id": "serena",
        "name": "Serena",
        "layer": "context-governor",
        "layer_name": "Context Governor",
        "layer_order": 2,
        "tagline": "Dynamic prompt-window budgeting & rate throttling",
        "token_waste_reduction": "25-30%",
        "color": "#06B6D4",
        "github_repo": "https://github.com/oraios/serena",
        "github_owner": "oraios",
        "github_name": "serena",
        "stats": {"token_saved": "25-30%", "latency": "-15%", "setup_time": "~8 min"},
        "overview": """**Serena** is the context governor - a policy engine that sits between your filtered files and the model, deciding *how much* of what Graft selected actually enters each prompt.

Serena treats the context window as a budget to be allocated, not a bucket to be filled. It throttles request rate, trims low-value context on the fly, and enforces per-turn token ceilings so a single runaway prompt can't blow your budget.

### Why it matters
- Prevents the "context stuffing" failure mode where agents pack the window to the brim and pay for tokens that never change the answer.
- Rate throttling avoids burst costs and provider rate-limit errors.
- Works as an MCP server, so it is agent-agnostic (Claude, Copilot, Codex, Antigravity).""",
        "mechanics": """### How Serena reduces token waste

1. **Window budgeting** - each turn gets a hard token ceiling; Serena drops the lowest-scoring context chunks to fit.
2. **Rate throttling** - coalesces rapid-fire agent calls, preventing redundant round-trips that each re-send the system prompt.
3. **Semantic retrieval over symbols** - rather than dumping files, Serena uses language-server symbols to send only the functions/classes referenced by the task.

> Serena shines *after* Graft: Graft decides the candidate set, Serena decides the per-turn allocation.""",
        "adoption_note": "Add Serena **second**, once Graft gives a stable file slice. Serena governs the budget within that slice; installing it before Graft means it governs a noisy, oversized candidate set.",
        "platform_notes": {
            "mac": "Runs as an MCP server via `uvx`. Requires Python 3.11+. Install `uv` with Homebrew.",
            "windows": "Use PowerShell. Install `uv` via the official installer; `uvx` handles the virtualenv. Ensure the MCP port isn't blocked by Windows Defender Firewall.",
            "wsl": "Install `uv` inside WSL. Point your Windows-side VSCode MCP config at the WSL server using the WSL loopback address.",
            "container": "Pin the Serena version in your image and start it as a sidecar process. Expose the MCP port only on the container network.",
            "remote-ssh": "Run Serena on the remote host next to the agent. Forward the MCP port through the SSH tunnel VSCode already maintains.",
            "corporate": "Serena needs outbound access only to your model provider. If a proxy is enforced, set `HTTPS_PROXY` before launching `uvx`.",
        },
        "setup_steps": [
            {
                "title": "Install uv and launch Serena",
                "description": "Serena ships as an MCP server runnable with uvx (no manual venv).",
                "commands": ["curl -LsSf https://astral.sh/uv/install.sh | sh", "uvx --from git+https://github.com/oraios/serena serena-mcp-server"],
                "snippet": "",
                "validation": {"command": "uvx --from git+https://github.com/oraios/serena serena-mcp-server --help", "expected": "Prints the MCP server help text with available flags."},
                "troubleshooting": [
                    {"problem": "`uvx: command not found`", "solution": "Restart your shell so the uv install updates PATH, or source your profile."},
                ],
            },
            {
                "title": "Register Serena as an MCP server",
                "description": "Tell your agent to route context through Serena.",
                "commands": [],
                "snippet": """// mcp config
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": ["--from", "git+https://github.com/oraios/serena", "serena-mcp-server"]
    }
  }
}""",
                "validation": {"command": "", "expected": "Serena appears in the agent's MCP server list as 'connected'."},
                "troubleshooting": [
                    {"problem": "Server shows 'disconnected'", "solution": "Check the agent's MCP logs. A non-zero exit usually means the uvx cache is stale - run `uv cache clean`."},
                ],
            },
            {
                "title": "Set a per-turn token budget",
                "description": "Configure the window ceiling so Serena can trim context to fit.",
                "commands": [],
                "snippet": """# .serena/config.yml
budget:
  max_prompt_tokens: 48000
  reserve_for_response: 8000
throttle:
  max_requests_per_min: 40""",
                "validation": {"command": "", "expected": "Agent telemetry shows prompts capped at ~48k tokens even on large tasks."},
                "troubleshooting": [
                    {"problem": "Responses feel truncated / lose context", "solution": "Your budget is too tight. Raise `max_prompt_tokens` or improve retrieval so the kept chunks are higher value."},
                ],
            },
        ],
    },
    {
        "id": "graphify",
        "name": "Graphify",
        "layer": "structural-graph",
        "layer_name": "Structural Graph",
        "layer_order": 3,
        "tagline": "AST dependency graph & code-symbol mapping",
        "token_waste_reduction": "40-50%",
        "color": "#8B5CF6",
        "github_repo": "https://github.com/Graphify-Labs/graphify",
        "github_owner": "Graphify-Labs",
        "github_name": "graphify",
        "stats": {"token_saved": "40-50%", "latency": "-22%", "setup_time": "~10 min"},
        "overview": """**Graphify** builds a structural graph of your codebase from the AST - every symbol, import, call edge and type reference becomes a node the agent can traverse instead of re-reading files.

When an agent understands *structure*, it stops pasting whole files to answer "where is this used?" A graph query returns the three relevant functions instead of thirty files.

### Why it matters
- Converts "read everything and hope" into "traverse the graph and know".
- Enables precise, token-cheap answers to cross-file questions.
- The graph is the substrate Codebase Memory and Archify both build on.""",
        "mechanics": """### How Graphify reduces token waste

1. **Symbol-level retrieval** - instead of a 400-line file, the agent fetches the one 12-line function the graph says is relevant.
2. **Call/import edges** - "who calls this?" is a graph walk, not a repo-wide grep dumped into context.
3. **Incremental re-indexing** - only changed files re-parse, so the graph stays cheap to maintain.

> Graphify needs a stable file slice to parse. Point it at the Graft output and it only indexes files that matter.""",
        "adoption_note": "Layer in Graphify **third**, once your Graft slice is stable. Its graph quality depends on a clean parse scope; a noisy workspace produces a bloated graph that costs more than it saves.",
        "platform_notes": {
            "mac": "Native parsers via tree-sitter. `xcode-select --install` if the native build step fails.",
            "windows": "Requires the MSVC build tools for the tree-sitter native bindings. Use the x64 Native Tools prompt for the first index.",
            "wsl": "Install build-essential inside WSL. Keep the repo on the Linux filesystem for fast incremental indexing.",
            "container": "Run the full index once at build time and bake the graph into the image. Incremental re-index at runtime on changed files only.",
            "remote-ssh": "Index on the remote host where the code lives. The graph DB should be stored remotely, not synced to the client.",
            "corporate": "Fully local - tree-sitter grammars can be vendored into the repo so no download is needed behind a firewall.",
        },
        "setup_steps": [
            {
                "title": "Install Graphify",
                "description": "Install the Graphify indexer.",
                "commands": ["pipx install graphify-cli"],
                "snippet": "",
                "validation": {"command": "graphify --version", "expected": "Prints the installed version."},
                "troubleshooting": [
                    {"problem": "Native build fails on install", "solution": "Install your platform's C toolchain (xcode-select / build-essential / MSVC) and retry."},
                ],
            },
            {
                "title": "Build the initial graph",
                "description": "Index the Graft-scoped files to construct the symbol graph.",
                "commands": ["graphify index --scope .graft/slice.json"],
                "snippet": "",
                "validation": {"command": "graphify stats", "expected": "Reports node and edge counts proportional to your codebase size."},
                "troubleshooting": [
                    {"problem": "Index is enormous / slow", "solution": "You are indexing beyond the Graft slice. Pass `--scope` pointing at the graft output so vendored code is excluded."},
                ],
            },
            {
                "title": "Expose graph queries to the agent",
                "description": "Serve the graph so the agent can traverse instead of reading files.",
                "commands": ["graphify serve --port 7803"],
                "snippet": """// query example
GET /symbols/usages?name=parseConfig
// returns 3 call sites, ~120 tokens, instead of 6 files""",
                "validation": {"command": "curl -s 'localhost:7803/symbols/usages?name=main'", "expected": "A small JSON list of usage sites."},
                "troubleshooting": [
                    {"problem": "Empty results for known symbols", "solution": "The language isn't indexed. Check `graphify stats` for your language and add the grammar with `graphify add-lang <lang>`."},
                ],
            },
        ],
    },
    {
        "id": "codebase-memory",
        "name": "Codebase Memory",
        "layer": "structural-graph",
        "layer_name": "Structural Graph",
        "layer_order": 3,
        "tagline": "Persistent semantic vector & key-value repo index",
        "token_waste_reduction": "30-40%",
        "color": "#F59E0B",
        "github_repo": "https://github.com/DeusData/codebase-memory-mcp",
        "github_owner": "DeusData",
        "github_name": "codebase-memory-mcp",
        "stats": {"token_saved": "30-40%", "latency": "-18%", "setup_time": "~9 min"},
        "overview": """**Codebase Memory** is a persistent MCP server that gives your agent long-term memory of the repo - a semantic vector index plus a key-value store of decisions, conventions and prior answers.

Without memory, every session re-discovers the same facts, paying tokens to re-read the same files to re-learn "we use Zod for validation." Codebase Memory remembers, and retrieves only the relevant snippet on demand.

### Why it matters
- Eliminates repeated re-discovery across sessions.
- Semantic search returns the *meaning-relevant* chunk, not a keyword grep.
- Complements Graphify: the graph gives structure, memory gives semantics and history.""",
        "mechanics": """### How Codebase Memory reduces token waste

1. **Persistent retrieval** - facts learned in session 1 are recalled in session 50 without re-reading source.
2. **Semantic chunking** - queries return the single most relevant chunk by embedding similarity, not whole files.
3. **Decision log** - architectural choices are stored once and injected only when relevant.

> Pairs naturally with Graphify: structure from the graph, semantics and history from memory. For polyglot repos, memory handles languages the graph grammar may not cover.""",
        "adoption_note": "Add Codebase Memory **after Graphify**. The two overlap - use Graphify for precise structural queries and Codebase Memory for semantic recall and history, especially in polyglot repos.",
        "platform_notes": {
            "mac": "Runs as an MCP server. Embeddings compute locally by default; first index can take a few minutes on large repos.",
            "windows": "Store the vector DB on a local SSD path, not a network drive, or query latency spikes.",
            "wsl": "Keep the vector store inside WSL. Cross-filesystem (`/mnt/c`) access makes embedding writes very slow.",
            "container": "Mount the vector DB as a named volume so memory persists across container restarts - otherwise you re-index every boot.",
            "remote-ssh": "Run the memory server remotely with the vector DB on the remote host for locality to the code.",
            "corporate": "Use a local embedding model to avoid sending code to an external embedding API. Configure the offline model in the MCP config.",
        },
        "setup_steps": [
            {
                "title": "Install the Codebase Memory MCP",
                "description": "Clone and install the MCP server.",
                "commands": ["pipx install codebase-memory-mcp"],
                "snippet": "",
                "validation": {"command": "codebase-memory --version", "expected": "Prints the version string."},
                "troubleshooting": [
                    {"problem": "Install hangs on embedding model download", "solution": "Pre-download the model or point to a local model path with `--embed-model`."},
                ],
            },
            {
                "title": "Index the repository",
                "description": "Build the persistent semantic index.",
                "commands": ["codebase-memory index --path . --store .cbm/store"],
                "snippet": "",
                "validation": {"command": "codebase-memory query 'how is auth handled'", "expected": "Returns a small set of relevant chunks, not whole files."},
                "troubleshooting": [
                    {"problem": "Irrelevant chunks returned", "solution": "Re-index with a smaller chunk size and ensure `.gitignore`-style excludes match your Graft slice."},
                ],
            },
            {
                "title": "Register as an MCP server",
                "description": "Connect memory to your agent for retrieval during chats.",
                "commands": [],
                "snippet": """{
  "mcpServers": {
    "codebase-memory": {
      "command": "codebase-memory",
      "args": ["serve", "--store", ".cbm/store"]
    }
  }
}""",
                "validation": {"command": "", "expected": "Agent lists codebase-memory as connected and can recall prior facts."},
                "troubleshooting": [
                    {"problem": "Memory doesn't persist between sessions", "solution": "The store path is ephemeral. Use an absolute path or a mounted volume for `--store`."},
                ],
            },
        ],
    },
    {
        "id": "archify",
        "name": "Archify",
        "layer": "context-governor",
        "layer_name": "Context Governor",
        "layer_order": 2,
        "tagline": "Architectural invariant enforcement & spec injection",
        "token_waste_reduction": "20-25%",
        "color": "#EC4899",
        "github_repo": "https://github.com/tt-a1i/archify",
        "github_owner": "tt-a1i",
        "github_name": "archify",
        "stats": {"token_saved": "20-25%", "latency": "-10%", "setup_time": "~7 min"},
        "overview": """**Archify** injects your architectural rules and design invariants into the agent's context *and* checks generated code against them - so the agent stops proposing changes that violate your conventions.

Rework is the silent token killer: the agent writes code, you reject it for breaking a layering rule, it rewrites. Archify front-loads the rules so the first answer is already compliant.

### Why it matters
- Fewer rejected/rewritten turns means fewer round-trips and fewer tokens.
- Encodes "the way we build here" once, as enforceable specs.
- Reads structural facts from Graphify to check invariants precisely.""",
        "mechanics": """### How Archify reduces token waste

1. **Spec injection** - a compact, prioritized rule-set enters the prompt instead of the agent re-deriving conventions from scattered files.
2. **Invariant checks** - generated diffs are validated against layering/dependency rules before you ever see them, cutting rework turns.
3. **Targeted context** - rules reference Graphify nodes, so only the implicated modules are pulled in.

> Archify is a governor: it works best with Graphify feeding it structural facts and Serena budgeting how much rule context to inject.""",
        "adoption_note": "Introduce Archify **after Graphify**, once there is a structural graph to check invariants against. Earlier than that, it can only inject static specs without verification.",
        "platform_notes": {
            "mac": "Pure config-driven, no native deps. Rules live in a versioned `archify.yml`.",
            "windows": "No special requirements. Use forward slashes in module path patterns for portability.",
            "wsl": "Runs identically to Linux. Keep `archify.yml` in the repo so it syncs across environments.",
            "container": "Bake `archify.yml` into the image. Rules are static config, so no runtime download needed.",
            "remote-ssh": "Runs on the remote host alongside Graphify. Share the same graph endpoint.",
            "corporate": "Entirely local and offline. Ideal for locked-down environments since no external calls are made.",
        },
        "setup_steps": [
            {
                "title": "Install Archify",
                "description": "Install the Archify rule engine.",
                "commands": ["npm install -g @archify/cli"],
                "snippet": "",
                "validation": {"command": "archify --version", "expected": "Prints the version."},
                "troubleshooting": [
                    {"problem": "`command not found`", "solution": "Add the global npm bin directory to PATH (see `npm bin -g`)."},
                ],
            },
            {
                "title": "Author your invariants",
                "description": "Define the architectural rules the agent must respect.",
                "commands": ["archify init"],
                "snippet": """# archify.yml
layers:
  - name: ui
    mayImport: [domain]
  - name: domain
    mayImport: []
rules:
  - no-cross-layer-imports
  - forbid: "import.*from.*secrets"
graph: http://localhost:7803""",
                "validation": {"command": "archify check", "expected": "Reports current violations (expected to be zero on a clean repo)."},
                "troubleshooting": [
                    {"problem": "Archify can't resolve modules", "solution": "Point `graph` at a running Graphify server, or set `tsconfig`/`paths` so module resolution works."},
                ],
            },
            {
                "title": "Inject specs into the agent",
                "description": "Feed the compiled rule-set into the agent context.",
                "commands": ["archify export --format prompt > .archify/spec.md"],
                "snippet": """// settings
{ "aiAgent.systemContext": [".archify/spec.md"] }""",
                "validation": {"command": "", "expected": "Agent proposals respect the layering rules on the first attempt."},
                "troubleshooting": [
                    {"problem": "Agent still breaks rules", "solution": "Spec too long and getting trimmed by the governor. Prioritize the top 10 rules or raise Serena's injection budget."},
                ],
            },
        ],
    },
    {
        "id": "agentsview",
        "name": "Agentsview",
        "layer": "agent-interface",
        "layer_name": "Agent Interface",
        "layer_order": 5,
        "tagline": "VSCode sidebar & real-time token analytics",
        "token_waste_reduction": "15-20%",
        "color": "#3B82F6",
        "github_repo": "https://github.com/kenn-io/agentsview",
        "github_owner": "kenn-io",
        "github_name": "agentsview",
        "stats": {"token_saved": "15-20%", "latency": "n/a", "setup_time": "~5 min"},
        "overview": """**Agentsview** is the cockpit - a VSCode sidebar that visualizes, in real time, exactly what every tool below it is doing: which files Graft included, how Serena budgeted the window, what Graphify retrieved, and live token spend per turn.

You can't optimize what you can't see. Agentsview turns token cost from an opaque monthly bill into a per-turn dashboard, surfacing the exact moments you overspend.

### Why it matters
- Real-time token analytics expose the 20% of turns causing 80% of cost.
- One glance shows whether Graft/Serena/Graphify are actually engaged.
- Closes the loop: observe, tune a config, watch the savings.""",
        "mechanics": """### How Agentsview reduces token waste

1. **Per-turn token meter** - see spend as it happens and catch runaway prompts immediately.
2. **Pipeline inspector** - confirms each lower tool is engaged; a silent misconfig (e.g. Graft bypassed) becomes obvious.
3. **Savings attribution** - shows how many tokens each tool saved, so you know what's pulling its weight.

> Agentsview sits at the top of the pipeline and reads telemetry from every tool beneath it - install it last so it has something to observe.""",
        "adoption_note": "Install Agentsview **last**. It observes the whole stack, so it's only useful once Graft, Serena, Graphify, Codebase Memory and Archify are emitting telemetry.",
        "platform_notes": {
            "mac": "Install from the VSCode Marketplace. No extra deps.",
            "windows": "Marketplace install. If the sidebar is blank, allow the extension host through the firewall for local telemetry ports.",
            "wsl": "Install the extension in the WSL context (not locally) so it reads telemetry from the WSL-hosted servers.",
            "container": "Use the devcontainer extensions list to auto-install Agentsview when the container attaches.",
            "remote-ssh": "Install in the Remote-SSH context. Telemetry ports are read over the existing SSH tunnel.",
            "corporate": "If the Marketplace is blocked, sideload the signed `.vsix` your security team approves. No external calls at runtime.",
        },
        "setup_steps": [
            {
                "title": "Install the VSCode extension",
                "description": "Add Agentsview from the Marketplace (or sideload the .vsix).",
                "commands": ["code --install-extension kenn-io.agentsview"],
                "snippet": "",
                "validation": {"command": "code --list-extensions | grep agentsview", "expected": "Prints kenn-io.agentsview."},
                "troubleshooting": [
                    {"problem": "`code` command missing", "solution": "In VSCode run 'Shell Command: Install code command in PATH' from the command palette."},
                ],
            },
            {
                "title": "Connect to the pipeline",
                "description": "Tell Agentsview where each tool emits telemetry.",
                "commands": [],
                "snippet": """// .vscode/settings.json
{
  "agentsview.sources": {
    "graft": "http://localhost:7801",
    "graphify": "http://localhost:7803",
    "serena": "mcp://serena"
  }
}""",
                "validation": {"command": "", "expected": "Sidebar shows live status dots (green) for each connected tool."},
                "troubleshooting": [
                    {"problem": "A source shows red/offline", "solution": "That tool's server isn't running or the port is wrong. Verify with the tool's own health check."},
                ],
            },
            {
                "title": "Read the token meter",
                "description": "Open the sidebar and watch per-turn token spend and savings.",
                "commands": [],
                "snippet": "// Open: View -> Agentsview, or Cmd+Shift+A",
                "validation": {"command": "", "expected": "Per-turn token spend updates live as you chat with the agent."},
                "troubleshooting": [
                    {"problem": "Meter stays at zero", "solution": "The agent isn't routing through the pipeline. Confirm the contextProvider/MCP config from earlier tools is active."},
                ],
            },
        ],
    },
    {
        "id": "ponytail",
        "name": "Ponytail",
        "layer": "output-governor",
        "layer_name": "Output Governor",
        "layer_order": 4,
        "tagline": "Makes the agent write the least code that works",
        "token_waste_reduction": "20-22%",
        "color": "#14B8A6",
        "github_repo": "https://github.com/dietrichgebert/ponytail",
        "github_owner": "dietrichgebert",
        "github_name": "ponytail",
        "stats": {"token_saved": "20-22%", "latency": "-27%", "setup_time": "~2 min"},
        "overview": """**Ponytail** is the output governor. It is a single skill/prompt you install into your agent that makes it think like the laziest senior dev in the room: *the best code is the code you never wrote.*

Every other tool here shrinks the *input* (which files, how much context). Ponytail shrinks the *output*: it stops the agent from over-building. You ask for a date picker and a bare agent installs a library, writes a wrapper component and a stylesheet. With Ponytail it reaches for the native `<input type="date">` and moves on.

### Why it matters
- Less generated code means fewer output tokens, fewer bugs, and far less review and rework.
- It is one prompt with zero infrastructure, so it is the cheapest possible win in the whole stack.
- Benchmarked on a real FastAPI + React repo: about 54% less code, 22% fewer tokens, 20% cheaper, 27% faster, with safety fully preserved.""",
        "mechanics": """### How Ponytail reduces token waste

Before writing code the agent stops at the first rung that holds:

1. Does this need to exist? If not, skip it (YAGNI).
2. Already in this codebase? Reuse it, don't rewrite.
3. Does the stdlib do it? Use it.
4. Native platform feature? Use it.
5. Installed dependency? Use it.
6. One line? One line.
7. Only then: the minimum that works.

The ladder runs *after* the agent understands the problem, not instead of it. It is lazy about the solution, never about reading the code.

> Lazy, not negligent: trust-boundary validation, data-loss handling, security and accessibility are never cut. The code ends up small because it is necessary, not golfed.""",
        "adoption_note": "Adopt Ponytail **first**. It is a single prompt with zero infrastructure, so it pays off on day one and compounds with everything you layer on afterwards. It governs *what gets built*, which is orthogonal to the context tools, so there is nothing to wait for.",
        "platform_notes": {
            "mac": "Pure prompt/skill, no native dependencies. Install the Claude Code plugin, or copy AGENTS.md into the repo for any other agent.",
            "windows": "Identical to every other OS. It is a text skill, so there are no Windows-specific build or path concerns.",
            "wsl": "Place AGENTS.md / the skill inside the repo on the Linux filesystem so it is picked up wherever the agent runs.",
            "container": "Bake AGENTS.md (or the skill files) into the image so every container session starts with Ponytail active. No runtime download needed.",
            "remote-ssh": "Commit AGENTS.md / the skill to the repo so it travels to the remote host automatically; the agent reads it there.",
            "corporate": "Fully offline. No marketplace or network required: just copy AGENTS.md into the project. Only install Ponytail from DietrichGebert/ponytail or @dietrichgebert/ponytail.",
        },
        "setup_steps": [
            {
                "title": "Install the skill",
                "description": "For Claude Code, add the marketplace and install the plugin. For any other agent you copy a single rules file instead (see the platform tip).",
                "commands": ["/plugin marketplace add DietrichGebert/ponytail", "/plugin install ponytail@ponytail"],
                "snippet": "",
                "validation": {"command": "", "expected": "Ponytail's startup notice shows the current mode (e.g. 'full') at the start of the session."},
                "troubleshooting": [
                    {"problem": "Agent doesn't change behaviour", "solution": "The ruleset isn't loaded. For instruction-only agents (Copilot, Cursor rules, Windsurf, Cline, Antigravity) copy AGENTS.md into the project root and start a new session."},
                ],
            },
            {
                "title": "Pick an intensity",
                "description": "Set how aggressively Ponytail trims. Start at the default and dial up only if the codebase keeps over-building.",
                "commands": ["/ponytail full"],
                "snippet": "# modes: lite | full | ultra | off\n# /ponytail ultra   -> for when the codebase has wronged you personally",
                "validation": {"command": "", "expected": "The mode-change message confirms the new level."},
                "troubleshooting": [
                    {"problem": "Too aggressive, skips things you wanted", "solution": "Drop to `/ponytail lite`, or turn it off for a turn with `/ponytail off`. Insist on a bigger solution and it will build it, correctly."},
                ],
            },
            {
                "title": "Review and harvest the savings",
                "description": "Use the review command on a diff to get a delete-list, and check the measured impact.",
                "commands": ["/ponytail-review", "/ponytail-gain"],
                "snippet": "// /ponytail-review  -> flags over-engineering in the current diff\n// /ponytail-debt    -> collects deferred `ponytail:` shortcuts into a ledger",
                "validation": {"command": "", "expected": "Review returns a concrete list of lines/abstractions that can be removed."},
                "troubleshooting": [
                    {"problem": "Commands not available", "solution": "Commands need a skill-capable host (Claude Code, Codex, OpenCode, Gemini, etc.). Instruction-only adapters get the always-on ruleset without the slash commands."},
                ],
            },
        ],
    },
]


def decision_recommendation(answers: dict):
    """Rule-based recommendation engine. Pure if/then, no AI.

    answers keys: repo_size, languages (list), team_size, agent, cost_sensitivity
    """
    repo_size = answers.get("repo_size", "medium")
    languages = answers.get("languages", []) or []
    team_size = answers.get("team_size", "solo")
    cost = answers.get("cost_sensitivity", "medium")

    recommended = ["ponytail", "graft"]  # everyone starts with Ponytail (zero infra) + Graft
    reasons = {
        "ponytail": "A single prompt with zero infrastructure that makes the agent write less code - the cheapest possible win, so adopt it first.",
        "graft": "Filesystem filtering is the highest-leverage first win on any repo - it cuts tokens before every other layer.",
    }

    # Serena: anyone cost-sensitive or on medium+ repos
    if cost in ("high", "medium") or repo_size in ("medium", "large", "huge"):
        recommended.append("serena")
        reasons["serena"] = "Per-turn window budgeting prevents context stuffing - essential when cost matters or repos are non-trivial."

    # Graphify: medium+ repos benefit most from structural retrieval
    if repo_size in ("medium", "large", "huge"):
        recommended.append("graphify")
        reasons["graphify"] = "A structural graph pays off once the repo is large enough that cross-file questions are common."

    # Codebase Memory: polyglot repos or large repos or teams
    polyglot = len(languages) >= 3
    if polyglot or repo_size in ("large", "huge") or team_size in ("small-team", "large-team"):
        recommended.append("codebase-memory")
        if polyglot:
            reasons["codebase-memory"] = "Polyglot repos benefit from semantic recall across languages the structural grammar may not fully cover."
        else:
            reasons["codebase-memory"] = "Persistent memory avoids re-discovery of conventions across many sessions and teammates."

    # Archify: teams or large repos where conventions drift
    if team_size in ("small-team", "large-team") or repo_size in ("large", "huge"):
        recommended.append("archify")
        reasons["archify"] = "Enforcing architectural invariants cuts costly rework turns - most valuable with multiple contributors or large surface area."

    # Agentsview: anyone highly cost-sensitive, or always as the cockpit
    if cost == "high" or len(recommended) >= 3:
        recommended.append("agentsview")
        reasons["agentsview"] = "Real-time token analytics let you verify the stack is engaged and spot the turns driving your bill."

    # Order by adoption order
    recommended = [t for t in ADOPTION_ORDER if t in recommended]

    # Estimate savings (qualitative, sum of midpoints capped)
    savings_map = {"ponytail": 21, "graft": 40, "serena": 27, "graphify": 45, "codebase-memory": 35, "archify": 22, "agentsview": 17}
    # Diminishing returns: each additional tool contributes less
    total = 0.0
    factor = 1.0
    for t in recommended:
        total += savings_map[t] * factor * 0.45
        factor *= 0.82
    estimated_savings = min(int(total), 72)

    return {
        "recommended": recommended,
        "reasons": reasons,
        "estimated_savings_pct": estimated_savings,
        "adoption_order": recommended,
    }


TRADEOFFS = [
    {
        "title": "Codebase Memory MCP vs Graphify for polyglot repos",
        "option_a": "Graphify",
        "option_b": "Codebase Memory",
        "guidance": "Graphify gives exact structural answers (call sites, imports) but only for languages with a tree-sitter grammar. Codebase Memory uses embeddings, so it covers any language and recalls intent/history, at the cost of less precise structural queries. For a repo spanning 4+ languages where some lack grammars, lead with Codebase Memory; where everything is TS/Python/Go, lead with Graphify and add memory for history.",
        "winner_when": {"Graphify": "Mono/bi-lingual repos needing precise cross-file structure", "Codebase Memory": "Polyglot repos or when session-to-session recall matters most"},
    },
    {
        "title": "Serena vs Archify as your context governor",
        "option_a": "Serena",
        "option_b": "Archify",
        "guidance": "They govern different things. Serena budgets *quantity* (how many tokens per turn). Archify governs *correctness* (what rules the output must obey). They are complementary, not competing - but if you can only run one, pick Serena for pure cost control, Archify for teams fighting convention drift and rework.",
        "winner_when": {"Serena": "Raw token-cost control on any repo", "Archify": "Teams where rejected/rewritten diffs are the main waste"},
    },
    {
        "title": "Ponytail vs the context tools (shrinking output vs input)",
        "option_a": "Ponytail",
        "option_b": "Context tools (Graft/Serena/Graphify)",
        "guidance": "They act on opposite ends of the pipeline and do not overlap. Graft/Serena/Graphify shrink the *input* - which files and how much context the agent ingests. Ponytail shrinks the *output* - how much code the agent writes back. You do not choose between them: Ponytail is a free, zero-infra prompt that stacks on top of whatever context tools you run, and its biggest wins are on tasks with an over-build trap (reaching for a native input instead of a library).",
        "winner_when": {"Ponytail": "Every project - it is one prompt, zero infra, and cuts generated code", "Context tools (Graft/Serena/Graphify)": "When the cost is in oversized context rather than over-built output"},
    },
]

COST_PLAYBOOK = [
    {"tool": "ponytail", "when": "Always, from day one (zero infra)", "savings": "20-22%", "note": "Shrinks the code the agent writes - fewer output tokens, bugs and rework."},
    {"tool": "graft", "when": "Always, from day one", "savings": "35-45%", "note": "Pre-ingestion filtering compounds through every downstream tool."},
    {"tool": "serena", "when": "Cost-sensitive work or medium+ repos", "savings": "25-30%", "note": "Caps per-turn spend; prevents context-stuffing blowouts."},
    {"tool": "graphify", "when": "Frequent cross-file questions on larger repos", "savings": "40-50%", "note": "Symbol retrieval replaces whole-file dumps."},
    {"tool": "codebase-memory", "when": "Long-lived repos, polyglot, or teams", "savings": "30-40%", "note": "Stops repeated re-discovery across sessions."},
    {"tool": "archify", "when": "Multi-contributor repos with strong conventions", "savings": "20-25%", "note": "Cuts rework round-trips by front-loading rules."},
    {"tool": "agentsview", "when": "Once 3+ tools are active", "savings": "15-20%", "note": "Observability that surfaces the costliest turns to tune."},
]


# Platform-specific overrides for the install (step 0) of each tool. macOS is the
# base; only the platforms that genuinely differ carry an override. Each override
# may provide its own commands and always carries a platform tip note.
PLATFORM_STEP_OVERRIDES = {
    "graft": {
        "windows": {"note": "Run in an elevated PowerShell if you hit EPERM. Use forward slashes in .graftrc glob patterns."},
        "wsl": {"note": "Install inside the WSL distro (not Windows). Keep the repo under ~/ on the Linux filesystem, not /mnt/c."},
        "container": {"commands": ["RUN npm install -g @trailhq/graft"], "note": "Add to your Dockerfile and run graft in one-shot mode (graft plan) on start - disable the watcher daemon."},
        "remote-ssh": {"note": "Install on the remote host - the VSCode server runs there. A local install has no effect."},
        "corporate": {"commands": ["npm install -g @trailhq/graft --registry=$NPM_PROXY"], "note": "If npm is proxied, set --registry to your internal mirror. Core grafting itself needs no network."},
    },
    "serena": {
        "windows": {"commands": ["powershell -c \"irm https://astral.sh/uv/install.ps1 | iex\"", "uvx --from git+https://github.com/oraios/serena serena-mcp-server"], "note": "Use the PowerShell installer and allow the MCP port through Windows Defender Firewall."},
        "wsl": {"note": "Install uv inside WSL; point the Windows-side VSCode MCP config at the WSL server via the WSL loopback address."},
        "container": {"commands": ["RUN curl -LsSf https://astral.sh/uv/install.sh | sh"], "note": "Pin the Serena ref and run it as a sidecar; expose the MCP port only on the container network."},
        "remote-ssh": {"note": "Run Serena on the remote host and forward the MCP port through the existing SSH tunnel."},
        "corporate": {"commands": ["export HTTPS_PROXY=$CORP_PROXY", "curl -LsSf https://astral.sh/uv/install.sh | sh"], "note": "Set HTTPS_PROXY before launching uvx so it can reach your model provider."},
    },
    "graphify": {
        "windows": {"note": "Install the MSVC Build Tools first, then run the initial index from the x64 Native Tools prompt."},
        "wsl": {"commands": ["sudo apt-get install -y build-essential", "pipx install graphify-cli"], "note": "Install build-essential in WSL and keep the repo on the Linux filesystem for fast incremental indexing."},
        "container": {"commands": ["RUN pipx install graphify-cli"], "note": "Index once at build time and bake the graph into the image; incremental re-index at runtime."},
        "remote-ssh": {"note": "Install and index on the remote host; store the graph DB remotely, not synced to the client."},
        "corporate": {"note": "Vendor the tree-sitter grammars into the repo so no grammar download is needed behind the firewall."},
    },
    "codebase-memory": {
        "windows": {"note": "Store the vector DB on a local SSD path, not a network drive, or query latency spikes."},
        "wsl": {"note": "Keep the vector store inside WSL; writing embeddings across /mnt/c is very slow."},
        "container": {"commands": ["RUN pipx install codebase-memory-mcp"], "note": "Mount the vector DB as a named volume so memory persists across container restarts."},
        "remote-ssh": {"note": "Run the memory server on the remote host with the vector DB local to the code."},
        "corporate": {"commands": ["codebase-memory --embed-model /opt/models/local-embed"], "note": "Use a local embedding model to avoid sending code to an external embedding API."},
    },
    "archify": {
        "windows": {"note": "Use forward slashes in module path patterns in archify.yml for portability."},
        "wsl": {"note": "Runs identically to Linux; keep archify.yml committed so it syncs across environments."},
        "container": {"commands": ["RUN npm install -g @archify/cli"], "note": "Bake archify.yml into the image - rules are static config with no runtime download."},
        "remote-ssh": {"note": "Run on the remote host next to Graphify and share the same graph endpoint."},
        "corporate": {"note": "Entirely local and offline - ideal for locked-down environments since no external calls are made."},
    },
    "agentsview": {
        "windows": {"note": "If the sidebar is blank, allow the extension host through the firewall for local telemetry ports."},
        "wsl": {"note": "Install the extension in the WSL context so it reads telemetry from the WSL-hosted servers."},
        "container": {"commands": ["# devcontainer.json\n\"customizations\": { \"vscode\": { \"extensions\": [\"kenn-io.agentsview\"] } }"], "note": "Use the devcontainer extensions list to auto-install Agentsview when the container attaches."},
        "remote-ssh": {"note": "Install in the Remote-SSH context; telemetry ports are read over the existing SSH tunnel."},
        "corporate": {"commands": ["code --install-extension ./agentsview.vsix"], "note": "If the Marketplace is blocked, sideload the signed .vsix your security team approves."},
    },
    "ponytail": {
        "windows": {"note": "Identical on Windows - it's a text skill with no build or path concerns. Copy AGENTS.md into the repo for instruction-only agents."},
        "wsl": {"note": "Keep AGENTS.md / the skill inside the repo on the Linux filesystem so the WSL-hosted agent picks it up."},
        "container": {"commands": ["# Dockerfile\nCOPY AGENTS.md /app/AGENTS.md"], "note": "Bake AGENTS.md into the image so every container session starts with Ponytail active - no marketplace needed."},
        "remote-ssh": {"note": "Commit AGENTS.md / the skill to the repo so it travels to the remote host and the agent reads it there."},
        "corporate": {"commands": ["# no network needed - copy the ruleset into the repo:\ncp AGENTS.md ./AGENTS.md"], "note": "Fully offline: skip the marketplace and just copy AGENTS.md. Only install Ponytail from DietrichGebert/ponytail."},
    },
}

# Attach overrides to each tool's install step (step 0)
for _tool in TOOLS:
    _ov = PLATFORM_STEP_OVERRIDES.get(_tool["id"])
    if _ov and _tool["setup_steps"]:
        _tool["setup_steps"][0]["platform_overrides"] = _ov
