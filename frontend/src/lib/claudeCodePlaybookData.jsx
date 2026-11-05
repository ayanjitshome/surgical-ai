/* © 2026 Ayanjit Shome. All rights reserved. Concept by Ayanjit Shome. */
import {
  Target,
  FolderTree,
  FileText,
  Sparkles,
  Users,
  Shield,
  Plug,
  ListChecks,
} from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import {
  H2,
  H3,
  P,
  Lead,
  UL,
  LI,
  Mono,
  Note,
  FilterTable,
  Checklist,
} from "@/components/playbook/PlaybookBits";

/* ---------------- Chapter 1 ---------------- */
const Chapter1 = ({ accent }) => (
  <div className="space-y-6">
    <Lead>
      Most people open Claude Code, type a request and hope. A configured
      setup means Claude starts every session already knowing your stack,
      your rules and your workflows, and cannot skip the checks you care
      about.
    </Lead>

    <H2 accent={accent}>The six layers at a glance</H2>
    <P>Think of it as six layers, each with one job.</P>

    <FilterTable
      testId="table-six-layers"
      columns={[
        { key: "layer", label: "Layer", filter: "select" },
        { key: "job", label: "Job" },
        { key: "when", label: "Loaded when" },
        { key: "where", label: "Where it lives" },
      ]}
      rows={[
        {
          layer: "CLAUDE.md and rules",
          job: "Facts and rules Claude should always know",
          when: "Every session",
          where: <Mono>CLAUDE.md</Mono>,
        },
        {
          layer: "Auto memory",
          job: "Notes Claude writes for itself from your corrections",
          when: "Every session (first 200 lines)",
          where: <Mono>~/.claude/projects/&lt;project&gt;/memory/</Mono>,
        },
        {
          layer: "Skills",
          job: "Reusable playbooks and slash commands",
          when: "Only when relevant, or when you type /name",
          where: <Mono>.claude/skills/&lt;name&gt;/SKILL.md</Mono>,
        },
        {
          layer: "Subagents",
          job: "Specialist workers with their own context and tools",
          when: "When Claude delegates, or you @-mention one",
          where: <Mono>.claude/agents/&lt;name&gt;.md</Mono>,
        },
        {
          layer: "Hooks",
          job: "Things that must always happen, enforced by code",
          when: "On lifecycle events (before or after tools, on stop)",
          where: (
            <>
              <Mono>hooks</Mono> key in <Mono>settings.json</Mono>
            </>
          ),
        },
        {
          layer: "MCP and plugins",
          job: "External tools and packaged bundles of all the above",
          when: "When connected or installed",
          where: (
            <>
              <Mono>.mcp.json</Mono>, <Mono>/plugin</Mono>
            </>
          ),
        },
      ]}
    />

    <H3>Rule of thumb</H3>
    <P>
      CLAUDE.md is what Claude should know, skills are what Claude should
      know how to do, subagents are who does side work, and hooks are
      what must happen regardless of what the model decides.
    </P>
  </div>
);

/* ---------------- Chapter 2 ---------------- */
const Chapter2 = ({ accent }) => (
  <div className="space-y-6">
    <Lead>
      Everything lives in two places: <Mono>~/.claude/</Mono> for you
      across every project, and <Mono>.claude/</Mono> inside the repo
      for the team. Commit the project folder; keep personal overrides
      in the <Mono>.local</Mono> files, which Claude Code gitignores for
      you.
    </Lead>

    <H2 accent={accent}>Personal home and team repo</H2>
    <CodeBlock
      label="tree"
      testId="code-folder-personal"
      code={`~/.claude/                        # YOU, every project on this machine
├── CLAUDE.md                     # personal preferences (tone, habits, tools you always use)
├── settings.json                 # personal permissions, hooks, env, statusline
├── skills/<name>/SKILL.md        # personal skills (your own workflows)
├── agents/<name>.md              # personal subagents
└── projects/<project>/memory/    # auto memory Claude writes (MEMORY.md + topic files)`}
    />
    <CodeBlock
      label="tree"
      testId="code-folder-repo"
      code={`your-repo/                        # THE TEAM, committed to git
├── CLAUDE.md                     # project brief: stack, commands, conventions, gotchas
├── CLAUDE.local.md               # your private notes for this repo (gitignore it)
├── .mcp.json                     # shared MCP servers
├── .claude/
│   ├── settings.json             # shared permissions, hooks, plugins
│   ├── settings.local.json       # your overrides for this repo (auto-gitignored)
│   ├── rules/*.md                # modular rules, optionally path-scoped
│   ├── skills/<name>/SKILL.md    # team skills = slash commands + playbooks
│   ├── agents/<name>.md          # team subagents
│   ├── hooks/                    # scripts your hooks call
│   └── agent-memory/<agent>/     # subagent memory (memory: project)
└── packages/api/
    ├── CLAUDE.md                 # loads when Claude works in packages/api
    └── .claude/skills/           # nested skills, load on demand`}
    />

    <H3>Personal versus team paths</H3>
    <FilterTable
      testId="table-scope"
      columns={[
        { key: "what", label: "What", filter: "select" },
        { key: "personal", label: "Personal (~)" },
        { key: "team", label: "Team (repo)" },
        { key: "local", label: "Private to you in this repo" },
      ]}
      rows={[
        {
          what: "Instructions",
          personal: <Mono>~/.claude/CLAUDE.md</Mono>,
          team: (
            <>
              <Mono>CLAUDE.md</Mono> or <Mono>.claude/CLAUDE.md</Mono>
            </>
          ),
          local: <Mono>CLAUDE.local.md</Mono>,
        },
        {
          what: "Settings, permissions, hooks",
          personal: <Mono>~/.claude/settings.json</Mono>,
          team: <Mono>.claude/settings.json</Mono>,
          local: <Mono>.claude/settings.local.json</Mono>,
        },
        {
          what: "Skills",
          personal: <Mono>~/.claude/skills/</Mono>,
          team: <Mono>.claude/skills/</Mono>,
          local: "(use personal)",
        },
        {
          what: "Subagents",
          personal: <Mono>~/.claude/agents/</Mono>,
          team: <Mono>.claude/agents/</Mono>,
          local: "(use personal)",
        },
        {
          what: "MCP servers",
          personal: <Mono>~/.claude.json</Mono>,
          team: <Mono>.mcp.json</Mono>,
          local: <Mono>~/.claude.json (per project)</Mono>,
        },
      ]}
    />

    <H3>Precedence when two files collide</H3>
    <P>
      The more specific file wins: managed policy, then CLI flags, then{" "}
      <Mono>settings.local.json</Mono>, then project{" "}
      <Mono>settings.json</Mono>, then your user{" "}
      <Mono>settings.json</Mono>. For skills with the same name, personal
      beats project; for subagents, project beats personal.
    </P>
  </div>
);

/* ---------------- Chapter 3 ---------------- */
const Chapter3 = ({ accent }) => (
  <div className="space-y-6">
    <Lead>
      <Mono>CLAUDE.md</Mono> loads into every session, so every line
      costs context on every turn. Keep it short and put only what
      Claude cannot work out by reading the code. Run <Mono>/init</Mono>{" "}
      once to generate a starter, then cut it down by hand.
    </Lead>

    <H2 accent={accent}>How it loads</H2>
    <P>
      Claude Code walks up from where you start it and loads every{" "}
      <Mono>CLAUDE.md</Mono> and <Mono>CLAUDE.local.md</Mono> it finds,
      then loads subdirectory <Mono>CLAUDE.md</Mono> files on demand
      when it works in those folders. Your <Mono>~/.claude/CLAUDE.md</Mono>{" "}
      loads everywhere. Edit any of them in-session with{" "}
      <Mono>/memory</Mono>.
    </P>

    <H3>What belongs in it, and what to keep out</H3>
    <FilterTable
      testId="table-claude-md-content"
      columns={[
        { key: "in", label: "Put in CLAUDE.md" },
        { key: "out", label: "Keep out of CLAUDE.md" },
      ]}
      rows={[
        { in: "Build, test, lint commands Claude can't guess", out: "Anything Claude learns by reading the code" },
        { in: "Code style that differs from language defaults", out: 'Standard conventions ("write clean code")' },
        { in: 'How to run a single test, and what "done" means', out: "Long API docs: link them or use @imports" },
        { in: "Repo etiquette: branch names, commit format, PR rules", out: "File-by-file descriptions of the codebase" },
        { in: "Architecture decisions and the reason behind them", out: "Information that changes every week" },
        { in: "Environment quirks, required env vars, gotchas", out: "Multi-step procedures (make them skills)" },
      ]}
    />

    <H3>Starter template (aim for under about 100 lines)</H3>
    <CodeBlock
      label="markdown"
      testId="code-claude-md-starter"
      code={`# Project: <name>
One paragraph: what this is, who uses it, the stack.

## Commands
- Install: \`pnpm i\`
- Dev: \`pnpm dev\`
- Test one file: \`pnpm vitest run path/to/file.test.ts\`
- Typecheck + lint before every commit: \`pnpm check\`

## Conventions
- TypeScript strict; no \`any\`. Zod for all external input.
- API handlers live in \`src/routes/\`, business logic in \`src/services/\`.
- IMPORTANT: never edit files in \`src/generated/\`; run \`pnpm codegen\`.

## Workflow
- Plan first for anything touching more than 2 files.
- Write or update a test before fixing a bug.
- Conventional commits; one logical change per commit.

## Gotchas
- Local Postgres runs on port 5433, not 5432.
- Feature flags are read at boot; restart dev server after changing them.

## More context
- Architecture: @docs/architecture.md
- Git workflow: @docs/git.md`}
    />

    <H3>Three ways to stop CLAUDE.md bloating</H3>
    <UL ordered>
      <LI>
        <b>Imports.</b> <Mono>@path/to/file.md</Mono> pulls another file
        in; <Mono>@~/.claude/my-prefs.md</Mono> pulls in a personal
        file. Imports inside code spans are ignored.
      </LI>
      <LI>
        <b>Rules folder.</b> Split topics into{" "}
        <Mono>.claude/rules/*.md</Mono> (testing.md, api.md,
        security.md). Add <Mono>paths:</Mono> frontmatter so a rule
        loads only when Claude touches matching files:
      </LI>
    </UL>
    <CodeBlock
      label="markdown"
      testId="code-rules-frontmatter"
      code={`---
paths: ["src/api/**/*.ts"]
---
All endpoints validate input with Zod and return { data, error }.`}
    />
    <UL ordered>
      <LI>
        <b>Nested CLAUDE.md.</b> In a monorepo, put a short{" "}
        <Mono>CLAUDE.md</Mono> in each package; it loads only when
        Claude works there.
      </LI>
    </UL>

    <H3>A short note on auto memory</H3>
    <P>
      Auto memory is separate: Claude writes notes to{" "}
      <Mono>~/.claude/projects/&lt;project&gt;/memory/MEMORY.md</Mono>{" "}
      when you correct it, and the first 200 lines (or 25KB) load each
      session. Say "add this to CLAUDE.md" when a lesson should be
      shared with the team rather than kept in Claude's private notes.
      Toggle it from <Mono>/memory</Mono>. Run <Mono>/doctor</Mono>{" "}
      periodically: it flags CLAUDE.md content Claude could derive from
      the code and offers to move procedures into skills.
    </P>
  </div>
);

/* ---------------- Chapter 4 ---------------- */
const Chapter4 = ({ accent }) => (
  <div className="space-y-6">
    <Lead>
      A skill is a folder with a <Mono>SKILL.md</Mono> file. Only its
      short description sits in context; the full body loads when Claude
      decides it's relevant or you type <Mono>/skill-name</Mono>. Make a
      skill whenever you catch yourself pasting the same instructions
      twice, or when a CLAUDE.md section turns into a procedure. Custom
      slash commands are now skills:{" "}
      <Mono>.claude/commands/deploy.md</Mono> still works, but new work
      goes in <Mono>.claude/skills/deploy/SKILL.md</Mono>.
    </Lead>

    <H2 accent={accent}>Where to store which skill</H2>
    <FilterTable
      testId="table-skills-location"
      columns={[
        { key: "where", label: "Put it in", filter: "select" },
        { key: "when", label: "When" },
        { key: "examples", label: "Examples" },
      ]}
      rows={[
        {
          where: "~/.claude/skills/<name>/ (personal)",
          when: "Your own habits, useful in every repo",
          examples: "explain-code, write-pr-description, standup notes",
        },
        {
          where: ".claude/skills/<name>/ (project, committed)",
          when: "Anything tied to this codebase or team process",
          examples: "deploy, new-endpoint, db-migration, release notes",
        },
        {
          where: "<package>/.claude/skills/ (nested)",
          when: "Monorepo package-specific workflows",
          examples: "apps/web/.claude/skills/new-component",
        },
        {
          where: "A plugin's skills/",
          when: "Sharing across many repos or teams",
          examples: "Company-wide security-review, incident postmortem",
        },
      ]}
    />
    <P>
      Same name in two places: personal beats project, and your skill
      replaces a bundled one of the same name.
    </P>

    <H3>SKILL.md anatomy</H3>
    <CodeBlock
      label="tree"
      testId="code-skill-tree"
      code={`.claude/skills/new-endpoint/
├── SKILL.md          # required: frontmatter + core steps (keep under 500 lines)
├── reference.md      # loaded only when SKILL.md points Claude to it
├── examples/         # sample handlers, tests
└── scripts/scaffold.sh  # executed, never loaded into context`}
    />
    <CodeBlock
      label="markdown"
      testId="code-skill-example"
      code={`---
name: new-endpoint
description: Scaffold a new REST endpoint with validation, service, and tests. Use when the user asks to add an API route or endpoint.
argument-hint: [resource-name]
allowed-tools: Bash(\${CLAUDE_SKILL_DIR}/scripts/scaffold.sh *) Read Edit Write
paths: ["src/routes/**"]
---

Create endpoint for $ARGUMENTS:
1. Run \`\${CLAUDE_SKILL_DIR}/scripts/scaffold.sh $ARGUMENTS\`.
2. Define the Zod schema first, then the handler, then the service.
3. Add a test in \`tests/routes/\` covering 200, 400 and 404.
4. Run \`pnpm check\` and fix everything before reporting done.

For error-shape rules see [reference.md](reference.md).`}
    />

    <H3>Frontmatter fields that matter</H3>
    <FilterTable
      testId="table-skill-frontmatter"
      columns={[
        { key: "field", label: "Field", filter: "select" },
        { key: "use", label: "Use it for" },
      ]}
      rows={[
        { field: "description", use: 'The trigger. Lead with what it does and "Use when...". Capped at 1,536 characters in the listing' },
        { field: "disable-model-invocation: true", use: "Side-effect workflows only you should fire: /deploy, /commit, /release" },
        { field: "user-invocable: false", use: "Background knowledge only Claude should pull in, hidden from the / menu" },
        { field: "allowed-tools", use: "Pre-approve tools for that turn, so the skill runs without prompts" },
        { field: "context: fork + agent:", use: "Run the skill in an isolated subagent (e.g. agent: Explore for research)" },
        { field: "paths", use: "Auto-load only when working on matching files" },
        { field: "model, effort", use: "Use a cheaper or stronger model for this skill" },
        { field: "hooks", use: "Enforce rules while the skill is active" },
      ]}
    />

    <Note>
      <b>Live data in the prompt.</b> A line like{" "}
      <Mono>!`git diff HEAD`</Mono> runs before Claude reads the skill
      and inlines the output, so the skill starts grounded in your real
      state. Use <Mono>$ARGUMENTS</Mono>, <Mono>$0</Mono>,{" "}
      <Mono>$1</Mono> for arguments.
    </Note>

    <H3>Starter skills worth having</H3>
    <UL>
      <LI>
        <b>/plan-feature</b> (project): interview me, read the relevant
        code, write a plan to <Mono>docs/plans/&lt;feature&gt;.md</Mono>
        , stop for approval.
      </LI>
      <LI>
        <b>/fix-issue &lt;n&gt;</b> (project, manual): read the GitHub
        issue, reproduce with a failing test, fix, run checks, commit.
      </LI>
      <LI>
        <b>/commit</b> (project, manual): run checks, write a
        conventional commit from the diff.
      </LI>
      <LI>
        <b>verify</b> (project): Claude Code runs a project skill named
        verify before each commit; let <Mono>/verify</Mono> record your
        build-and-run recipe once.
      </LI>
      <LI>
        <b>api-conventions</b> (project, Claude-only): the patterns
        every endpoint follows.
      </LI>
    </UL>
    <P>
      Also use the bundled ones before writing your own:{" "}
      <Mono>/code-review</Mono>, <Mono>/debug</Mono>,{" "}
      <Mono>/simplify</Mono>, <Mono>/batch</Mono>, <Mono>/loop</Mono>,{" "}
      <Mono>/run</Mono>, <Mono>/verify</Mono>, <Mono>/doctor</Mono>. Run{" "}
      <Mono>/skill-doctor</Mono> to find skills that cost context but
      never get used, and the skill-creator plugin to test a skill with
      and without it.
    </P>
  </div>
);

/* ---------------- Chapter 5 ---------------- */
const Chapter5 = ({ accent }) => (
  <div className="space-y-6">
    <Lead>
      A subagent is a worker with its own context window, system prompt,
      tools and model. Its job is to soak up noisy work (searching 40
      files, running a test suite, reading logs) and hand back a short
      summary, so your main conversation stays clean. Use a skill when
      you want a playbook in the main thread; use a subagent when you
      want the work done somewhere else.
    </Lead>

    <H2 accent={accent}>Where agent files live, and who wins</H2>
    <FilterTable
      testId="table-agent-priority"
      columns={[
        { key: "location", label: "Location", filter: "select" },
        { key: "scope", label: "Scope" },
        { key: "priority", label: "Priority" },
      ]}
      rows={[
        { location: "Managed settings", scope: "Whole organization", priority: "1 (highest)" },
        { location: "--agents '{...}' CLI flag", scope: "This session only", priority: "2" },
        { location: ".claude/agents/", scope: "This project (commit it)", priority: "3" },
        { location: "~/.claude/agents/", scope: "All your projects", priority: "4" },
        { location: "Plugin agents/", scope: "Where the plugin is enabled", priority: "5 (lowest)" },
      ]}
    />
    <P>
      Subfolders like <Mono>agents/review/</Mono> are fine; identity
      comes only from the <Mono>name</Mono> field, so keep names unique.
    </P>

    <H3>How to create one</H3>
    <UL ordered>
      <LI>
        <b>Ask Claude:</b> "Create a project subagent in{" "}
        <Mono>.claude/agents/</Mono> called test-runner that runs the
        test suite, reports only failing tests with errors, read-only
        except Bash, use haiku."
      </LI>
      <LI>
        <b>Or write the file yourself.</b> Only <Mono>name</Mono> and{" "}
        <Mono>description</Mono> are required; the body is the system
        prompt.
      </LI>
      <LI>
        <b>Check it:</b> Claude Code picks up edits within seconds.
        Restart only if the <Mono>agents/</Mono> folder didn't exist
        when the session started.
      </LI>
    </UL>

    <CodeBlock
      label="markdown"
      testId="code-agent-example"
      code={`---
name: code-reviewer
description: Reviews diffs for bugs, security and readability. Use proactively after any code change.
tools: Read, Grep, Glob, Bash
model: sonnet
memory: project
---

You are a senior reviewer. When invoked:
1. Run \`git diff\` and read only the changed files plus their direct callers.
2. Check: correctness, error handling, input validation, secrets, tests.
3. Report as Critical / Warning / Suggestion, each with file:line and a fix.
Check your memory for recurring issues in this repo, and save new patterns.`}
    />

    <H3>Frontmatter fields you'll actually use</H3>
    <FilterTable
      testId="table-agent-frontmatter"
      columns={[
        { key: "field", label: "Field", filter: "select" },
        { key: "what", label: "What it does" },
      ]}
      rows={[
        { field: "description", what: 'When to delegate. Add "use proactively" to encourage automatic use' },
        { field: "tools / disallowedTools", what: "Allowlist or denylist. A reviewer gets no Edit / Write" },
        { field: "model", what: "haiku for cheap search, sonnet / opus for judgment, inherit to match" },
        { field: "skills", what: "Preload full skill content at startup (e.g. api-conventions)" },
        { field: "memory", what: "project, user or local: a persistent notes folder that survives sessions" },
        { field: "isolation: worktree", what: "Run in a throwaway git worktree so edits can't touch your checkout" },
        { field: "permissionMode", what: "e.g. plan for read-only, acceptEdits for an implementer" },
        { field: "mcpServers", what: "Give only this agent an MCP server, keeping its tools out of the main context" },
        { field: "hooks", what: "Guardrails that run only while this agent is active" },
        { field: "maxTurns, effort, color", what: "Cap runaway loops, tune reasoning, label in the UI" },
      ]}
    />

    <H3>Delegation patterns</H3>
    <UL>
      <LI>
        <b>Automatic:</b> Claude delegates when a task matches a
        description.
      </LI>
      <LI>
        <b>Named:</b> "Use the code-reviewer subagent on my changes."
      </LI>
      <LI>
        <b>Guaranteed:</b> <Mono>@"code-reviewer (agent)"</Mono> review
        the auth module.
      </LI>
      <LI>
        <b>Whole session:</b> <Mono>claude --agent code-reviewer</Mono>,
        or <Mono>"agent": "code-reviewer"</Mono> in settings.
      </LI>
      <LI>
        <b>Patterns:</b> parallel research ("explore auth, db and api in
        separate subagents"), chaining (reviewer finds, fixer fixes),
        and isolating test runs.
      </LI>
    </UL>
    <P>
      Built-ins already cover a lot: <b>Explore</b> (fast read-only
      search), <b>Plan</b> (research during plan mode) and{" "}
      <b>general-purpose</b>. Subagents start fresh: they don't see your
      conversation, so restate anything critical in the request. A
      starter team: code reviewer (read-only), test-runner (haiku),
      debugger (can edit), security-auditor (read-only, opus).
    </P>
  </div>
);

/* ---------------- Chapter 6 ---------------- */
const Chapter6 = ({ accent }) => (
  <div className="space-y-6">
    <Lead>
      <Mono>CLAUDE.md</Mono> is advice Claude will probably follow;
      settings and hooks are enforced. Anything that must happen every
      time (formatting, blocking secrets, running tests) belongs here,
      not in a prompt.
    </Lead>

    <H2 accent={accent}>Permissions</H2>
    <P>
      Pre-approve the safe commands you run constantly and deny the
      dangerous ones. Deny always beats allow.
    </P>
    <CodeBlock
      label="json"
      testId="code-permissions"
      code={`// .claude/settings.json (committed)
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(pnpm test *)", "Bash(pnpm check)", "Bash(git status)",
      "Bash(git diff *)", "Bash(git log *)"
    ],
    "deny": [
      "Read(./.env)", "Read(./.env.*)", "Read(./secrets/**)",
      "Bash(git push --force *)", "Bash(rm -rf *)"
    ]
  }
}`}
    />

    <H3>Permission modes</H3>
    <P>
      Cycle with <b>Shift+Tab</b>: <Mono>default</Mono> asks for risky
      actions, <Mono>acceptEdits</Mono> auto-accepts file edits,{" "}
      <Mono>plan</Mono> is read-only research, <Mono>auto</Mono> lets a
      classifier approve routine actions. Avoid{" "}
      <Mono>bypassPermissions</Mono> outside a sandbox or container.
    </P>

    <H2 accent={accent}>Hooks: the lifecycle events</H2>
    <P>
      Hooks are commands Claude Code runs at lifecycle events,
      configured under <Mono>hooks</Mono> in any settings file (or in a
      skill or agent's frontmatter). They receive JSON on stdin.{" "}
      <b>Exit 0</b> = continue, <b>exit 2</b> = block and send stderr
      back to Claude, any other code = non-blocking error. A policy
      script that exits 1 enforces nothing.
    </P>

    <FilterTable
      testId="table-hook-events"
      columns={[
        { key: "event", label: "Event", filter: "select" },
        { key: "fires", label: "Fires" },
        { key: "good", label: "Good for" },
      ]}
      rows={[
        { event: "PreToolUse", fires: "Before a tool runs", good: "Blocking writes to protected paths, unsafe SQL, .env reads" },
        { event: "PostToolUse", fires: "After a tool runs", good: "Auto-format and lint every edited file" },
        { event: "UserPromptSubmit", fires: "When you send a prompt", good: "Injecting context, ticket lookup" },
        { event: "Stop / SubagentStop", fires: "When Claude or a subagent finishes", good: "Run tests; notify you" },
        { event: "SessionStart", fires: "New or resumed session", good: "Load git branch, open issues, env checks" },
        { event: "Notification", fires: "Claude needs input", good: "Desktop or phone alert" },
        { event: "PreCompact", fires: "Before compaction", good: "Save notes" },
      ]}
    />

    <H3>A worked PostToolUse hook</H3>
    <CodeBlock
      label="json"
      testId="code-hooks-example"
      code={`{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Edit|Write",
        "hooks": [{ "type": "command",
          "command": "npx prettier --write \\"$(jq -r '.tool_input.file_path')\\"" }] }
    ],
    "PreToolUse": [
      { "matcher": "Edit|Write",
        "hooks": [{ "type": "command",
          "command": "\${CLAUDE_PROJECT_DIR}/.claude/hooks/protect-paths.sh" }] }
    ],
    "Notification": [
      { "hooks": [{ "type": "command",
        "command": "osascript -e 'display notification \\"Claude needs you\\"'" }] }
    ]
  }
}`}
    />
    <P>
      Besides shell commands, hooks can call an HTTP endpoint, ask a
      model a yes-or-no question, or spawn an agent. Use{" "}
      <Mono>/hooks</Mono> to view what's active. Hooks run with your
      full credentials, so review any hook a repo ships before trusting
      the folder.
    </P>

    <H3>Other settings worth knowing</H3>
    <UL>
      <LI>
        <Mono>env</Mono>: environment variables for every session (e.g.{" "}
        <Mono>CLAUDE_CODE_SUBAGENT_MODEL</Mono>).
      </LI>
      <LI>
        <Mono>model</Mono> and <Mono>effort</Mono>: set your default;
        switch with <Mono>/model</Mono>.
      </LI>
      <LI>
        <Mono>agent</Mono>: run every session in this repo as a named
        subagent.
      </LI>
      <LI>
        <Mono>skillOverrides</Mono>: hide or quiet skills without
        editing them (<Mono>/skills</Mono> writes this for you).
      </LI>
      <LI>
        <Mono>claudeMdExcludes</Mono>: skip irrelevant CLAUDE.md files
        in big monorepos.
      </LI>
    </UL>
  </div>
);

/* ---------------- Chapter 7 ---------------- */
const Chapter7 = ({ accent }) => (
  <div className="space-y-6">
    <Lead>
      MCP servers give Claude tools outside the repo: GitHub, Linear,
      Sentry, your database, a browser. Plugins bundle skills,
      subagents, hooks and MCP servers into one install, which is how
      you share a setup across repos.
    </Lead>

    <H2 accent={accent}>Adding and scoping MCP servers</H2>
    <P>
      Add one with <Mono>claude mcp add</Mono> (scope <Mono>local</Mono>
      , <Mono>project</Mono> or <Mono>user</Mono>); project-scoped
      servers go in <Mono>.mcp.json</Mono> so the team shares them.
      Check status with <Mono>/mcp</Mono>. Every connected server's tool
      descriptions cost context, so connect only what you use, and give
      heavy servers (like Playwright) to a single subagent via{" "}
      <Mono>mcpServers</Mono> instead.
    </P>
    <CodeBlock
      label="bash"
      testId="code-mcp-add"
      code={`claude mcp add --transport http github https://api.githubcopilot.com/mcp/ --scope project
claude mcp add playwright --scope user -- npx -y @playwright/mcp@latest`}
    />

    <H2 accent={accent}>Plugins</H2>
    <P>
      Browse with <Mono>/plugin</Mono>, then:
    </P>
    <CodeBlock
      label="bash"
      testId="code-plugin-install"
      code={`/plugin marketplace add anthropics/claude-plugins-official
/plugin install skill-creator@claude-plugins-official
/plugin install typescript-lsp@claude-plugins-official  # real go-to-definition and type errors`}
    />
    <P>
      Once your own setup stabilises, package it as a plugin so every
      repo and teammate gets the same skills and agents.
    </P>

    <H3>Quality-of-life extras</H3>
    <UL>
      <LI>
        <b>Status line</b> (<Mono>/statusline</Mono>): show model,
        branch and context usage at the bottom of the terminal.
      </LI>
      <LI>
        <b>Output styles</b>: change how Claude talks (e.g. an
        explanatory or learning style) without touching CLAUDE.md.
      </LI>
      <LI>
        <b>IDE integration</b>: run Claude Code inside VS Code or
        JetBrains to share selections and diagnostics.
      </LI>
      <LI>
        <b>
          <Mono>/doctor</Mono>
        </b>
        : setup checkup covering installs, unused extensions, bloated
        CLAUDE.md and permissions.
      </LI>
      <LI>
        <b>
          <Mono>/context</Mono>
        </b>
        : see exactly what is eating your context window.
      </LI>
    </UL>
  </div>
);

/* ---------------- Chapter 8 ---------------- */
const Chapter8 = ({ accent }) => (
  <div className="space-y-6">
    <Lead>
      A good setup is wasted if every task is one long prompt. The loop
      that produces clean, reviewable work (and a session log you'd be
      proud to share) is Explore, Plan, Code, Verify, Commit.
    </Lead>

    <H2 accent={accent}>The daily loop</H2>
    <UL ordered>
      <LI>
        <b>Explore.</b> Start in plan mode (Shift+Tab). "Read the auth
        module and the checkout flow; don't change anything. Explain
        how sessions are validated." Let Explore subagents do the
        reading.
      </LI>
      <LI>
        <b>Plan.</b> "Interview me about edge cases, then write a plan
        to <Mono>docs/plans/refunds.md</Mono>." Push back on the plan
        before any code exists; this is the cheapest place to fix
        mistakes.
      </LI>
      <LI>
        <b>Code.</b> Leave plan mode and implement one step at a time.
        Give Claude a way to check itself: a failing test first, a type
        check, or <Mono>/run</Mono> against the real app.
      </LI>
      <LI>
        <b>Verify.</b> Have the code-reviewer subagent review the diff
        in a fresh context, run <Mono>/verify</Mono>, and read the diff
        yourself.
      </LI>
      <LI>
        <b>Commit.</b> <Mono>/commit</Mono> or "commit with a
        conventional message and open a PR." Hooks format and test on
        the way.
      </LI>
    </UL>

    <H3>Debugging loop</H3>
    <P>
      Paste the exact error or stack trace, ask for a hypothesis and a
      failing test that reproduces it before a fix, then fix and
      re-run. <Mono>/debug</Mono> and a debugger subagent formalise
      this.
    </P>

    <H3>Context hygiene</H3>
    <UL>
      <LI>
        <Mono>/clear</Mono> between unrelated tasks; a fresh session
        beats a long, confused one.
      </LI>
      <LI>
        <Mono>/compact</Mono> with a focus ("keep the API decisions")
        when a long task fills up.
      </LI>
      <LI>
        <b>Esc</b> stops Claude without losing context; <b>Esc twice</b>{" "}
        or <Mono>/rewind</Mono> restores code or conversation to a
        checkpoint.
      </LI>
      <LI>
        <Mono>/context</Mono> shows what is using space; push noisy
        work into subagents.
      </LI>
      <LI>
        <Mono>/btw</Mono> asks a side question without adding it to
        history.
      </LI>
    </UL>

    <H3>Scaling up</H3>
    <UL>
      <LI>
        <Mono>claude --worktree</Mono> (or <Mono>isolation: worktree</Mono>{" "}
        on a subagent) runs parallel work on separate checkouts.
      </LI>
      <LI>
        <Mono>claude -p "..."</Mono> runs headless for CI, scripts and
        scheduled jobs.
      </LI>
      <LI>Background agents let several sessions run at once while you review.</LI>
    </UL>

    <H3>Prompting habits that make the logs look senior</H3>
    <P>
      State the goal and the constraint ("keep the public API
      unchanged"), point at files with <Mono>@path</Mono>, name how
      success is measured, and correct Claude early and specifically,
      then say "add that to CLAUDE.md" so the fix sticks.
    </P>

    <H2 accent={accent}>Setup checklist</H2>
    <P>An afternoon gets you from "just prompting" to a real setup.</P>
    <Checklist
      items={[
        { id: "init", text: "Run /init, then cut CLAUDE.md to the commands, conventions and gotchas Claude can't infer." },
        { id: "personal-claude-md", text: "Write ~/.claude/CLAUDE.md with your personal preferences." },
        { id: "settings-json", text: "Add .claude/settings.json with allow rules for safe commands and deny rules for secrets and destructive git." },
        { id: "hooks", text: "Add a PostToolUse format hook and a Notification hook." },
        { id: "skills", text: "Create 2 to 3 project skills for workflows you repeat (/plan-feature, /fix-issue, /commit)." },
        { id: "agents", text: "Create a read-only code-reviewer subagent and a cheap test-runner subagent." },
        { id: "mcp", text: "Connect only the MCP servers you use; install the LSP plugin for your language." },
        { id: "commit", text: "Commit .claude/ and CLAUDE.md; gitignore CLAUDE.local.md." },
        { id: "doctor", text: "Run /doctor and /context to check nothing is bloated." },
      ]}
    />

    <H3>Common mistakes</H3>
    <FilterTable
      testId="table-mistakes"
      columns={[
        { key: "mistake", label: "Mistake" },
        { key: "fix", label: "Fix" },
      ]}
      rows={[
        { mistake: "500-line CLAUDE.md nobody maintains", fix: "Keep the brief short; move procedures to skills and topics to .claude/rules/" },
        { mistake: "Rules that must always hold, written as advice", fix: "Make them hooks or deny rules" },
        { mistake: "One endless session for everything", fix: "/clear per task; push research into subagents" },
        { mistake: "Vague skill or agent descriptions", fix: 'Say what it does and "Use when..."; the description is the trigger' },
        { mistake: 'Every MCP server connected "just in case"', fix: "Each one costs context; scope heavy ones to a subagent" },
        { mistake: "Coding before planning", fix: "Plan mode first on anything touching more than a couple of files" },
        { mistake: "No way for Claude to check its work", fix: "Tests, type checks, /verify, a reviewer subagent" },
        { mistake: "--dangerously-skip-permissions on your laptop", fix: "Use allow rules or auto mode; bypass only inside a sandbox" },
      ]}
    />
  </div>
);

/* ---------------- Export the full ordered list ---------------- */
export const CHAPTERS = [
  {
    number: 1,
    slug: "why-setup-beats-prompting",
    title: "Why setup beats prompting",
    promise: "See the six layers at a glance.",
    takeaway:
      "A mental map of where CLAUDE.md, skills, subagents, hooks, MCP and plugins each fit, and when to reach for which.",
    Icon: Target,
    accent: "#0A84FF",
    Body: Chapter1,
  },
  {
    number: 2,
    slug: "folder-map",
    title: "The folder map",
    promise: "Where ~/.claude ends and .claude begins.",
    takeaway:
      "Know which file lives where, which belongs to the team, and which one wins when two settings collide.",
    Icon: FolderTree,
    accent: "#30D158",
    Body: Chapter2,
  },
  {
    number: 3,
    slug: "claude-md",
    title: "CLAUDE.md, the always-on brief",
    promise: "A short brief that pays for itself every session.",
    takeaway:
      "What belongs in CLAUDE.md, a starter template, and three ways to stop it bloating as the repo grows.",
    Icon: FileText,
    accent: "#BF5AF2",
    Body: Chapter3,
  },
  {
    number: 4,
    slug: "skills",
    title: "Skills",
    promise: "Reusable playbooks and slash commands.",
    takeaway:
      "When to write a skill, SKILL.md anatomy with a real example, and the frontmatter fields worth knowing.",
    Icon: Sparkles,
    accent: "#FF9F0A",
    Body: Chapter4,
  },
  {
    number: 5,
    slug: "subagents",
    title: "Subagents",
    promise: "Workers with their own context window.",
    takeaway:
      "When a subagent beats a skill, how to create one, and the delegation patterns that keep main chat clean.",
    Icon: Users,
    accent: "#FF453A",
    Body: Chapter5,
  },
  {
    number: 6,
    slug: "settings-permissions-hooks",
    title: "Settings, permissions and hooks",
    promise: "Advice versus enforcement, and when each wins.",
    takeaway:
      "The permissions block, the four permission modes, every lifecycle event, and a worked PostToolUse hook.",
    Icon: Shield,
    accent: "#FFD60A",
    Body: Chapter6,
  },
  {
    number: 7,
    slug: "mcp-plugins",
    title: "MCP servers and plugins",
    promise: "Tools outside the repo, shared across teams.",
    takeaway:
      "Add and scope MCP servers to one subagent, install plugins, and the quality-of-life extras to keep on.",
    Icon: Plug,
    accent: "#06B6D4",
    Body: Chapter7,
  },
  {
    number: 8,
    slug: "daily-workflow-checklist",
    title: "The daily workflow and the checklist",
    promise: "Explore, plan, code, verify, ship.",
    takeaway:
      "The habit loop, the debugging loop, the setup checklist you can tick off in a browser, and the common mistakes.",
    Icon: ListChecks,
    accent: "#EC4899",
    Body: Chapter8,
  },
];
