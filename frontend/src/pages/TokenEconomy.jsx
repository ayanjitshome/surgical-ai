/* © 2026 Ayanjit Shome. All rights reserved. Concept by Ayanjit Shome. */
import { useMemo, useState } from "react";
import {
  Coins, Zap, TrendingDown, AlertTriangle, CheckCircle2, XCircle,
  Database, MessageSquare, Terminal, Flame, Lock, Infinity as InfinityIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* -------- Content model (adapted to any agentic AI tool) -------- */

const AGENT_NOTES = {
  "Claude / Claude Code": {
    accent: "#D97757",
    caching: "Claude Projects: freeze the Knowledge files + Custom Instructions - these form the stable prefix that gets the 90% cache discount.",
    conversation: "Keep related work in one chat so the prefix stays warm. Start a fresh chat only when switching tasks.",
    cli: "Claude Code: use /compact (not /clear) around 70% of the context window. Keep your MCP tool list stable.",
    output: "Ask for diffs or just the changed lines - never 'rewrite the whole file with comments'.",
  },
  "GitHub Copilot": {
    accent: "#1F6FEB",
    caching: "Copilot Chat caches on repo + open-file context. Avoid renaming files mid-session; it invalidates the index.",
    conversation: "Group questions in the same chat panel. New file = new context, so revisit explanations only when needed.",
    cli: "Pin your workspace with .github/copilot-instructions.md - stable instructions = stable prefix.",
    output: "Prefer 'suggest a single edit' over 'rewrite'. Use inline chat for narrow surgical changes.",
  },
  "OpenAI Codex / Codex CLI": {
    accent: "#10A37F",
    caching: "Codex CLI caches on system prompt + sandbox file snapshot. Keep AGENTS.md and your tool list static.",
    conversation: "Chain tasks in one session when they share files. Spawn a new session for unrelated work.",
    cli: "Use codex compact / summary passes instead of clearing history. Keep sandbox tools deterministic (sort_keys=True on JSON).",
    output: "Ask for patches (diffs), not full rewrites. Request tests inline rather than a separate pass.",
  },
  "Google Antigravity": {
    accent: "#4285F4",
    caching: "Antigravity caches on the Workflow + MCP tool graph. Lock your workflow nodes before heavy use.",
    conversation: "Each plan runs with the same preamble - once a plan is set, iterate inside it rather than replanning.",
    cli: "In the agentic IDE, surface the plan but don't edit the plan mid-task - a plan edit resets the cache window.",
    output: "Instruct the agent to emit only the diff and the test, not the full file.",
  },
  "Any agent (universal)": {
    accent: "var(--brand)",
    caching: "Treat the first ~2k tokens of your context as sacred: tool definitions, project rules, schemas. Never edit them during a work session.",
    conversation: "Append-only wins. A linear conversation with a stable top is the cheapest shape a prompt can take.",
    cli: "Summarise, don't clear. Keep tool outputs deterministic (sorted keys, stable formats, no timestamps in payloads).",
    output: "Output tokens drain budgets 4-7x faster than cached input. Ask for diffs, not rewrites.",
  },
};

const TABS = [
  { id: "caching", label: "Caching", icon: Database },
  { id: "conversation", label: "Conversation Habits", icon: MessageSquare },
  { id: "cli", label: "CLI & IDE", icon: Terminal },
  { id: "output", label: "Output Traps", icon: Flame },
];

const TAB_CONTENT = {
  caching: {
    headline: "Lock the stable prefix.",
    sub: "Caching gives you a ~90% discount on input tokens - but only when the top of your prompt is byte-for-byte identical to a previous request within the TTL window.",
    quickWins: [
      "Upload heavy docs (API refs, schemas, brand rules) into a project / knowledge base once.",
      "Freeze your custom instructions. Do not edit them mid-session.",
      "Keep dynamic data (today's date, env vars) out of the preamble.",
      "Changing a single character in the prefix invalidates the cache - treat it as code.",
    ],
    doDont: [
      { ok: true, text: "Put universal rules in instructions and leave them alone." },
      { ok: true, text: "Put large reference material in project knowledge files." },
      { ok: false, text: "Edit instructions or swap knowledge files between prompts." },
      { ok: false, text: "Inject timestamps or random IDs into the system preamble." },
    ],
  },
  conversation: {
    headline: "Append-only beats restart.",
    sub: "Caches read linearly from the top. Keep related questions in one chat - the preamble and your prior turns are already warm. Start a new chat only when you fully switch tasks.",
    quickWins: [
      "Batch all questions about a feature in one chat.",
      "Start a new chat when switching to a different domain (code → marketing).",
      "A new chat in the same project still hits the project-knowledge cache - just without the stale history.",
      "Avoid 'rephrase my last question' loops; each rewrite breaks the warm trail.",
    ],
    doDont: [
      { ok: true, text: "Stay in one chat for a single feature or bug." },
      { ok: true, text: "Open a fresh chat when context no longer applies." },
      { ok: false, text: "Keep stretching one chat across unrelated tasks - old turns bloat input." },
      { ok: false, text: "Clear and restart mid-task; you lose the whole cached prefix." },
    ],
  },
  cli: {
    headline: "Keep the tool surface boring.",
    sub: "In CLIs and agentic IDEs, every tool definition and MCP server description lives in the system prompt. Turning tools on or off rewrites the preamble.",
    quickWins: [
      "Pin a stable set of MCP / plugin tools before a session; don't toggle mid-flow.",
      "Prefer /compact or summary passes over /clear - they preserve the stable preamble.",
      "Make custom tool outputs deterministic: sort_keys=True on JSON, no timestamps in payloads.",
      "Keep instruction files (AGENTS.md, .copilot-instructions, project rules) static during a run.",
    ],
    doDont: [
      { ok: true, text: "Lock your MCP tool list for the duration of a task." },
      { ok: true, text: "Summarise instead of clearing when context nears the limit." },
      { ok: false, text: "Toggle tools / MCP servers mid-task to 'free up space'." },
      { ok: false, text: "Emit non-deterministic JSON from your custom tools." },
    ],
  },
  output: {
    headline: "The output tax is unavoidable.",
    sub: "Caching only discounts input tokens. Output tokens cost full price - and typically drain usage limits 4-7x faster than input. The cheapest fix is to ask for less.",
    quickWins: [
      "Ask for diffs, not full files. 'Show me the 10 lines to change' not 'rewrite with comments'.",
      "Tell the agent to be concise - verbosity burns the budget twice (now and in future context).",
      "Avoid 'explain, then do it' prompts - do the work, explain only if asked.",
      "For reviews, request 'top 3 issues' rather than exhaustive essays.",
    ],
    doDont: [
      { ok: true, text: "Ask for a minimal patch and the test." },
      { ok: true, text: "Say 'be concise. output only the diff.'" },
      { ok: false, text: "Ask the agent to re-paste the entire file with changes." },
      { ok: false, text: "Request long explanations when the code change is enough." },
    ],
  },
};

/* -------- Calculator ----------
 * Rough but useful mental model. All inputs are in tokens; output is a cost
 * index (relative to input tokens at list price = 1.0x).
 *  - cached input    = 0.10x of normal input
 *  - uncached input  = 1.00x
 *  - output tokens   = 5.00x (midpoint of the "4-7x drain" rule)
 * Numbers are approximations - usage caps vary by plan/model.
 */
const OUTPUT_WEIGHT = 5;
const CACHED_WEIGHT = 0.1;

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return Math.round(n).toString();
}

const Calculator = () => {
  const [inputTokens, setInputTokens] = useState(20000);
  const [cachedPct, setCachedPct] = useState(80);
  const [outputTokens, setOutputTokens] = useState(2000);
  const [promptsPerHour, setPromptsPerHour] = useState(8);

  const stats = useMemo(() => {
    const cached = inputTokens * (cachedPct / 100);
    const fresh = inputTokens - cached;
    const costWithCache = cached * CACHED_WEIGHT + fresh + outputTokens * OUTPUT_WEIGHT;
    const costNoCache = inputTokens + outputTokens * OUTPUT_WEIGHT;
    const savings = Math.max(0, 1 - costWithCache / costNoCache);
    const hourlyCost = costWithCache * promptsPerHour;
    const fiveHour = hourlyCost * 5;
    return { costWithCache, costNoCache, savings, hourlyCost, fiveHour };
  }, [inputTokens, cachedPct, outputTokens, promptsPerHour]);

  return (
    <section className="hig-elevated p-6 sm:p-8 fade-up" data-testid="token-economy-calculator" aria-labelledby="calc-title">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: "var(--brand-soft)" }}>
          <Zap className="w-5 h-5" style={{ color: "var(--brand)" }} aria-hidden="true" />
        </div>
        <div>
          <h2 id="calc-title" className="hig-title-3 text-primary-c">What a prompt actually costs</h2>
          <p className="hig-footnote mt-1">Model-agnostic estimate. Input tokens from cache cost ~10% of fresh ones. Output tokens are the real drain.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 mb-6">
        <Field
          label="Input tokens per prompt"
          hint="System prompt + files + conversation history"
          value={inputTokens} min={1000} max={200000} step={1000}
          onChange={setInputTokens}
          testId="calc-input-tokens"
        />
        <Field
          label="Cached share"
          hint="% of input served from cache (stable prefix)"
          value={cachedPct} min={0} max={100} step={5} suffix="%"
          onChange={setCachedPct}
          testId="calc-cached-pct"
        />
        <Field
          label="Output tokens per prompt"
          hint="What the agent writes back"
          value={outputTokens} min={100} max={20000} step={100}
          onChange={setOutputTokens}
          testId="calc-output-tokens"
        />
        <Field
          label="Prompts per hour"
          hint="Typical throughput in a working session"
          value={promptsPerHour} min={1} max={60} step={1}
          onChange={setPromptsPerHour}
          testId="calc-prompts-hour"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Effective cost / prompt" value={fmt(stats.costWithCache)} tone="neutral" testId="stat-cost" />
        <Stat label="Vs no cache" value={fmt(stats.costNoCache)} tone="muted" testId="stat-nocache" />
        <Stat
          label="Saved by caching"
          value={`${Math.round(stats.savings * 100)}%`}
          tone="positive"
          testId="stat-savings"
          icon={<TrendingDown className="w-4 h-4" aria-hidden="true" />}
        />
        <Stat
          label="Drain over 5h"
          value={fmt(stats.fiveHour)}
          tone="warning"
          testId="stat-drain"
          icon={<Flame className="w-4 h-4" aria-hidden="true" />}
        />
      </div>

      <p className="hig-footnote mt-5 flex items-start gap-2">
        <InfinityIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          Rule of thumb: a well-cached session with concise outputs can run <strong className="text-primary-c">5-10x longer</strong> on the same usage cap than an un-cached verbose one.
        </span>
      </p>
    </section>
  );
};

const Field = ({ label, hint, value, min, max, step, onChange, suffix = "", testId }) => (
  <label className="block" htmlFor={testId}>
    <div className="flex items-baseline justify-between mb-2">
      <span className="hig-headline text-primary-c">{label}</span>
      <span className="text-[13px] font-mono text-primary-c" data-testid={`${testId}-value`}>{value.toLocaleString()}{suffix}</span>
    </div>
    <input
      id={testId}
      data-testid={testId}
      type="range"
      min={min} max={max} step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-[var(--brand)]"
      aria-describedby={`${testId}-hint`}
    />
    <div id={`${testId}-hint`} className="hig-footnote mt-1">{hint}</div>
  </label>
);

const Stat = ({ label, value, tone = "neutral", icon, testId }) => {
  const toneStyle = {
    neutral: { color: "var(--text-primary)", bg: "var(--bg-card-hover)" },
    muted: { color: "var(--text-muted)", bg: "var(--bg-card-hover)" },
    positive: { color: "var(--success)", bg: "rgba(48,209,88,0.10)" },
    warning: { color: "var(--warning)", bg: "rgba(255,159,10,0.10)" },
  }[tone];
  return (
    <div className="rounded-[12px] p-4 border border-c" style={{ background: toneStyle.bg }} data-testid={testId}>
      <div className="hig-footnote">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-[-0.02em] flex items-center gap-2" style={{ color: toneStyle.color }}>
        {icon}{value}
      </div>
    </div>
  );
};

/* -------- Tabs ----------- */

const Tabs = ({ active, setActive }) => (
  <div role="tablist" aria-label="Token economy topics" className="flex flex-wrap gap-1.5 p-1.5 rounded-[14px] border border-c surface-card w-fit">
    {TABS.map((t) => {
      const Icon = t.icon;
      const isActive = active === t.id;
      return (
        <button
          key={t.id}
          role="tab"
          id={`tab-${t.id}`}
          aria-selected={isActive}
          aria-controls={`panel-${t.id}`}
          tabIndex={isActive ? 0 : -1}
          onClick={() => setActive(t.id)}
          data-testid={`token-economy-tab-${t.id}`}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[14px] font-medium transition-all",
            isActive ? "bg-[var(--brand)] text-white shadow-[var(--shadow-elev-1)]" : "text-secondary-c hover:text-primary-c hover:bg-[var(--bg-card-hover)]"
          )}
        >
          <Icon className="w-4 h-4" aria-hidden="true" />
          {t.label}
        </button>
      );
    })}
  </div>
);

const TabPanel = ({ id, content }) => (
  <section
    role="tabpanel"
    id={`panel-${id}`}
    aria-labelledby={`tab-${id}`}
    tabIndex={0}
    className="mt-6 space-y-6 focus:outline-none"
    data-testid={`token-economy-panel-${id}`}
  >
    <div className="fade-up">
      <h2 className="hig-title-2 text-primary-c">{content.headline}</h2>
      <p className="hig-body text-secondary-c mt-2 max-w-3xl">{content.sub}</p>
    </div>

    <div className="hig-card p-6 fade-up">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-5 h-5" style={{ color: "var(--success)" }} aria-hidden="true" />
        <h3 className="hig-headline text-primary-c">Quick wins</h3>
      </div>
      <ul className="space-y-2.5">
        {content.quickWins.map((w, i) => (
          <li key={i} className="flex items-start gap-3 hig-callout text-secondary-c">
            <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--brand-soft)" }}>
              <span className="text-[11px] font-semibold" style={{ color: "var(--brand)" }}>{i + 1}</span>
            </span>
            <span>{w}</span>
          </li>
        ))}
      </ul>
    </div>

    <div className="grid md:grid-cols-2 gap-4 fade-up">
      <div className="hig-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4" style={{ color: "var(--success)" }} aria-hidden="true" />
          <span className="hig-headline text-primary-c">Do</span>
        </div>
        <ul className="space-y-2">
          {content.doDont.filter(d => d.ok).map((d, i) => (
            <li key={i} className="text-secondary-c hig-callout flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: "var(--success)" }} />
              <span>{d.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="hig-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <XCircle className="w-4 h-4" style={{ color: "var(--danger)" }} aria-hidden="true" />
          <span className="hig-headline text-primary-c">Don't</span>
        </div>
        <ul className="space-y-2">
          {content.doDont.filter(d => !d.ok).map((d, i) => (
            <li key={i} className="text-secondary-c hig-callout flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: "var(--danger)" }} />
              <span>{d.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

/* -------- Per-agent accordion ----------- */

const AgentCallouts = ({ active }) => {
  const [open, setOpen] = useState("Any agent (universal)");
  const field = {
    caching: "caching",
    conversation: "conversation",
    cli: "cli",
    output: "output",
  }[active];

  return (
    <section className="mt-10 fade-up" aria-labelledby="agent-notes-title">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-5 h-5" style={{ color: "var(--brand)" }} aria-hidden="true" />
        <h2 id="agent-notes-title" className="hig-title-3 text-primary-c">Per-agent playbook</h2>
      </div>
      <div className="grid gap-2">
        {Object.entries(AGENT_NOTES).map(([name, note]) => {
          const isOpen = open === name;
          return (
            <div key={name} className="hig-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : name)}
                aria-expanded={isOpen}
                aria-controls={`agent-${name.replace(/\W+/g, "-")}`}
                data-testid={`agent-toggle-${name.replace(/\W+/g, "-").toLowerCase()}`}
                className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left"
              >
                <span className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: note.accent, boxShadow: `0 0 10px ${note.accent === "var(--brand)" ? "rgba(10,132,255,0.4)" : note.accent + "80"}` }} />
                  <span className="hig-headline text-primary-c">{name}</span>
                </span>
                <span className="text-muted-c text-sm">{isOpen ? "Collapse" : "Expand"}</span>
              </button>
              {isOpen && (
                <div
                  id={`agent-${name.replace(/\W+/g, "-")}`}
                  className="px-5 pb-5 border-t border-c pt-4 text-secondary-c hig-body"
                >
                  {note[field]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

/* -------- Page root ----------- */

const TokenEconomy = () => {
  const [active, setActive] = useState("caching");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 fade-up" data-testid="token-economy-page">
      {/* Hero */}
      <div className="mb-10">
        <div className="hig-chip hig-chip-accent mb-4" data-testid="token-economy-eyebrow">
          <Coins className="w-3.5 h-3.5" aria-hidden="true" />
          Token Economy
        </div>
        <h1 className="hig-title-1 text-primary-c max-w-3xl">
          Make every token work <span style={{ color: "var(--brand)" }}>twice as hard</span>.
        </h1>
        <p className="hig-body text-secondary-c mt-4 max-w-2xl">
          The principles below apply to any agentic AI tool - Claude, Copilot, Codex, Antigravity, or your own MCP stack.
          Caching discounts input tokens by ~90%, but only if you treat the top of your context as sacred.
        </p>
      </div>

      <Calculator />

      <div className="mt-10">
        <Tabs active={active} setActive={setActive} />
        <TabPanel id={active} content={TAB_CONTENT[active]} />
      </div>

      <AgentCallouts active={active} />

      {/* Final trap */}
      <section className="mt-10 hig-card p-6 fade-up" aria-labelledby="trap-title">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(255,159,10,0.14)" }}>
            <AlertTriangle className="w-5 h-5" style={{ color: "var(--warning)" }} aria-hidden="true" />
          </div>
          <div>
            <h2 id="trap-title" className="hig-title-3 text-primary-c">The one trap caching can't fix</h2>
            <p className="hig-body text-secondary-c mt-2 max-w-3xl">
              Caching only discounts <strong className="text-primary-c">input</strong> tokens.
              Output tokens cost full price and drain usage caps roughly <strong className="text-primary-c">4-7x faster</strong> than input.
              A perfectly cached prompt that asks the agent to "rewrite the entire 500-line file with comments" will still blow through your limit.
              Ask for <em>diffs</em>, demand brevity, and let the tools do the heavy context work.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TokenEconomy;
