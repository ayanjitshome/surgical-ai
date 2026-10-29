/* © 2026 Ayanjit Shome. All rights reserved. Concept by Ayanjit Shome. */
import { useEffect, useMemo, useState } from "react";
import {
  Coins, Zap, TrendingDown, AlertTriangle, CheckCircle2, XCircle,
  Database, MessageSquare, Terminal, Flame, Lock, Infinity as InfinityIcon,
  Save, RotateCcw, Table2, Calendar, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CACHED_WEIGHT, OUTPUT_WEIGHT, STORAGE_KEY, DEFAULTS,
  FALLBACK_MODELS, CUSTOM_MODEL, loadScenario, fmtUsd,
} from "@/lib/scenario";

/* -------- Content model (adapted to any agentic AI tool) -------- */

const AGENT_NOTES = {
  "Claude / Claude Code": {
    accent: "#D97757",
    caching: "In Claude Projects, freeze the Knowledge files and Custom Instructions. They form the stable prefix that gets the 90% cache discount.",
    conversation: "Keep related work in one chat so the prefix stays warm. Start a fresh chat only when you switch tasks.",
    cli: "In Claude Code, use /compact (not /clear) around 70% of the context window. Keep your MCP tool list stable.",
    output: "Ask for diffs or just the changed lines. Never 'rewrite the whole file with comments'.",
  },
  "GitHub Copilot": {
    accent: "#1F6FEB",
    caching: "Copilot Chat caches on repo and open-file context. Avoid renaming files mid-session. It invalidates the index.",
    conversation: "Group questions in the same chat panel. A new file means a new context, so revisit explanations only when needed.",
    cli: "Pin your workspace with .github/copilot-instructions.md. Stable instructions mean a stable prefix.",
    output: "Prefer 'suggest a single edit' over 'rewrite'. Use inline chat for narrow surgical changes.",
  },
  "OpenAI Codex / Codex CLI": {
    accent: "#10A37F",
    caching: "Codex CLI caches on the system prompt and sandbox file snapshot. Keep AGENTS.md and your tool list static.",
    conversation: "Chain tasks in one session when they share files. Spawn a new session for unrelated work.",
    cli: "Use codex compact or summary passes instead of clearing history. Keep sandbox tools deterministic (sort_keys=True on JSON).",
    output: "Ask for patches (diffs), not full rewrites. Request tests inline rather than in a separate pass.",
  },
  "Google Antigravity": {
    accent: "#4285F4",
    caching: "Antigravity caches on the Workflow and MCP tool graph. Lock your workflow nodes before heavy use.",
    conversation: "Every plan runs with the same preamble. Once a plan is set, iterate inside it rather than replanning.",
    cli: "In the agentic IDE, surface the plan, but do not edit the plan mid-task. A plan edit resets the cache window.",
    output: "Tell the agent to emit only the diff and the test, not the full file.",
  },
  "Any agent (universal)": {
    accent: "var(--brand)",
    caching: "Treat the first 2k tokens of your context as sacred. Tool definitions, project rules, schemas. Never edit them during a work session.",
    conversation: "Append-only wins. A linear conversation with a stable top is the cheapest shape a prompt can take.",
    cli: "Summarise, do not clear. Keep tool outputs deterministic (sorted keys, stable formats, no timestamps in payloads).",
    output: "Output tokens drain budgets 4 to 7x faster than cached input. Ask for diffs, not rewrites.",
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
    sub: "Caching gives you a 90% discount on input tokens, but only when the top of your prompt is byte-for-byte identical to a previous request inside the TTL window.",
    quickWins: [
      "Upload heavy docs (API refs, schemas, brand rules) into a project or knowledge base once.",
      "Freeze your custom instructions. Do not edit them mid-session.",
      "Keep changing values (today's date, env vars) out of the preamble.",
      "Changing a single character in the prefix invalidates the cache. Treat it as code.",
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
    sub: "Caches read linearly from the top. Keep related questions in one chat. The preamble and your prior turns are already warm. Start a new chat only when you fully switch tasks.",
    quickWins: [
      "Batch all questions about a feature in one chat.",
      "Start a new chat when switching to a different domain (code to marketing).",
      "A new chat in the same project still hits the project-knowledge cache, just without the stale history.",
      "Avoid 'rephrase my last question' loops. Each rewrite breaks the warm trail.",
    ],
    doDont: [
      { ok: true, text: "Stay in one chat for a single feature or bug." },
      { ok: true, text: "Open a fresh chat when context no longer applies." },
      { ok: false, text: "Keep stretching one chat across unrelated tasks. Old turns bloat input." },
      { ok: false, text: "Clear and restart mid-task. You lose the whole cached prefix." },
    ],
  },
  cli: {
    headline: "Keep the tool surface boring.",
    sub: "In CLIs and agentic IDEs, every tool definition and MCP server description lives in the system prompt. Turning tools on or off rewrites the preamble.",
    quickWins: [
      "Pin a stable set of MCP or plugin tools before a session. Do not toggle mid-flow.",
      "Prefer /compact or summary passes over /clear. They preserve the stable preamble.",
      "Make custom tool outputs deterministic: sort_keys=True on JSON, no timestamps in payloads.",
      "Keep instruction files (AGENTS.md, .copilot-instructions, project rules) static during a run.",
    ],
    doDont: [
      { ok: true, text: "Lock your MCP tool list for the duration of a task." },
      { ok: true, text: "Summarise instead of clearing when context nears the limit." },
      { ok: false, text: "Toggle tools or MCP servers mid-task to 'free up space'." },
      { ok: false, text: "Emit non-deterministic JSON from your custom tools." },
    ],
  },
  output: {
    headline: "The output tax is unavoidable.",
    sub: "Caching only discounts input tokens. Output tokens cost full price, and typically drain usage limits 4 to 7x faster than input. The cheapest fix is to ask for less.",
    quickWins: [
      "Ask for diffs, not full files. 'Show me the 10 lines to change', not 'rewrite with comments'.",
      "Tell the agent to be concise. Verbosity burns the budget twice (now, and in future context).",
      "Avoid 'explain, then do it' prompts. Do the work, explain only if asked.",
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
 *  - output tokens   = 5.00x (midpoint of the 4 to 7x drain rule)
 * Numbers are approximations. Usage caps vary by plan and model.
 * Shared constants (CACHED_WEIGHT, OUTPUT_WEIGHT, STORAGE_KEY, DEFAULTS,
 * FALLBACK_MODELS, CUSTOM_MODEL, loadScenario, fmtUsd) live in
 * `lib/scenario.js` so Home's BudgetVerdict and this page agree.
 */

const PRESETS = [
  {
    id: "claude",
    label: "Typical Claude session",
    hint: "Projects, long chat, lots of cached prefix",
    accent: "#D97757",
    values: { inputTokens: 60000, cachedPct: 85, outputTokens: 1800, promptsPerHour: 10 },
  },
  {
    id: "copilot",
    label: "Copilot heavy day",
    hint: "Repo index, short back-and-forth edits",
    accent: "#1F6FEB",
    values: { inputTokens: 15000, cachedPct: 70, outputTokens: 800, promptsPerHour: 24 },
  },
  {
    id: "codex",
    label: "Codex CLI run",
    hint: "Sandbox, AGENTS.md, diff-first replies",
    accent: "#10A37F",
    values: { inputTokens: 40000, cachedPct: 75, outputTokens: 1500, promptsPerHour: 6 },
  },
  {
    id: "antigravity",
    label: "Antigravity plan",
    hint: "Agentic workflow, stable preamble, autonomous steps",
    accent: "#4285F4",
    values: { inputTokens: 80000, cachedPct: 90, outputTokens: 3000, promptsPerHour: 4 },
  },
];

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return Math.round(n).toString();
}

const Calculator = () => {
  const initial = typeof window !== "undefined" ? loadScenario() : null;
  const [inputTokens, setInputTokens] = useState(initial?.inputTokens ?? DEFAULTS.inputTokens);
  const [cachedPct, setCachedPct] = useState(initial?.cachedPct ?? DEFAULTS.cachedPct);
  const [outputTokens, setOutputTokens] = useState(initial?.outputTokens ?? DEFAULTS.outputTokens);
  const [promptsPerHour, setPromptsPerHour] = useState(initial?.promptsPerHour ?? DEFAULTS.promptsPerHour);
  const [mode, setMode] = useState(initial?.mode ?? DEFAULTS.mode);
  const [budgetUsd, setBudgetUsd] = useState(initial?.budgetUsd ?? DEFAULTS.budgetUsd);
  const [hoursPerDay, setHoursPerDay] = useState(initial?.hoursPerDay ?? DEFAULTS.hoursPerDay);
  const [daysPerMonth, setDaysPerMonth] = useState(initial?.daysPerMonth ?? DEFAULTS.daysPerMonth);
  const [modelId, setModelId] = useState(initial?.modelId ?? DEFAULTS.modelId);
  const [customInputRate, setCustomInputRate] = useState(initial?.customInputRate ?? DEFAULTS.customInputRate);
  const [customOutputRate, setCustomOutputRate] = useState(initial?.customOutputRate ?? DEFAULTS.customOutputRate);
  const [savedAt, setSavedAt] = useState(initial ? "loaded" : null);
  const [activePreset, setActivePreset] = useState(null);

  // Live pricing - start with the hardcoded fallback, overlay the server
  // response once /api/pricing resolves.
  const [livePricing, setLivePricing] = useState({ models: FALLBACK_MODELS, fetched_at: null, source: "fallback", stale: false });
  const [pricingError, setPricingError] = useState(null);
  useEffect(() => {
    const base = process.env.REACT_APP_BACKEND_URL || "";
    let cancelled = false;
    fetch(`${base}/api/pricing`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        if (cancelled || !data?.models?.length) return;
        setLivePricing({
          models: data.models,
          fetched_at: data.fetched_at,
          source: data.models.every((m) => m.source === "live") ? "live" : "mixed",
          stale: !!data.stale,
          source_url: data.source_url,
        });
      })
      .catch((e) => { if (!cancelled) setPricingError(e.message); });
    return () => { cancelled = true; };
  }, []);

  const MODELS = useMemo(() => [...livePricing.models, CUSTOM_MODEL], [livePricing]);
  const selectedModel = MODELS.find((m) => m.id === modelId) || MODELS[0];
  const effectiveInputRate = modelId === "custom" ? customInputRate : selectedModel.input;
  const effectiveOutputRate = modelId === "custom" ? customOutputRate : selectedModel.output;
  // Per-model token weight for the per-prompt cost-index (reflects how heavy
  // output is relative to input for that family).
  const effectiveOutputWeight = modelId === "custom"
    ? (customInputRate > 0 ? customOutputRate / customInputRate : OUTPUT_WEIGHT)
    : selectedModel.tokWeight;

  // Debounced auto-save so returning users see their own numbers.
  useEffect(() => {
    const scenario = {
      inputTokens, cachedPct, outputTokens, promptsPerHour,
      mode, budgetUsd, hoursPerDay, daysPerMonth,
      modelId, customInputRate, customOutputRate,
    };
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario));
        setSavedAt("saved");
      } catch { /* storage disabled - silent */ }
    }, 500);
    return () => clearTimeout(t);
  }, [inputTokens, cachedPct, outputTokens, promptsPerHour, mode, budgetUsd, hoursPerDay, daysPerMonth, modelId, customInputRate, customOutputRate]);

  const applyPreset = (preset) => {
    setInputTokens(preset.values.inputTokens);
    setCachedPct(preset.values.cachedPct);
    setOutputTokens(preset.values.outputTokens);
    setPromptsPerHour(preset.values.promptsPerHour);
    setActivePreset(preset.id);
  };

  const resetDefaults = () => {
    setInputTokens(DEFAULTS.inputTokens);
    setCachedPct(DEFAULTS.cachedPct);
    setOutputTokens(DEFAULTS.outputTokens);
    setPromptsPerHour(DEFAULTS.promptsPerHour);
    setMode(DEFAULTS.mode);
    setBudgetUsd(DEFAULTS.budgetUsd);
    setHoursPerDay(DEFAULTS.hoursPerDay);
    setDaysPerMonth(DEFAULTS.daysPerMonth);
    setModelId(DEFAULTS.modelId);
    setCustomInputRate(DEFAULTS.customInputRate);
    setCustomOutputRate(DEFAULTS.customOutputRate);
    setActivePreset(null);
  };

  const stats = useMemo(() => {
    const cached = inputTokens * (cachedPct / 100);
    const fresh = inputTokens - cached;
    // Per-prompt token-weight cost (unitless): cached 10%, output weighted per model.
    const costWithCache = cached * CACHED_WEIGHT + fresh + outputTokens * effectiveOutputWeight;
    const costNoCache = inputTokens + outputTokens * effectiveOutputWeight;
    const savings = Math.max(0, 1 - costWithCache / costNoCache);
    const hourlyCost = costWithCache * promptsPerHour;
    const fiveHour = hourlyCost * 5;
    // $ cost math uses the real input/output rates (not a shared multiplier).
    const usdPerPrompt =
      (cached * CACHED_WEIGHT + fresh) * (effectiveInputRate / 1_000_000) +
      outputTokens * (effectiveOutputRate / 1_000_000);
    const usdPerDay = usdPerPrompt * promptsPerHour * hoursPerDay;
    const usdPerMonth = usdPerDay * daysPerMonth;
    const runwayDays = usdPerDay > 0 ? budgetUsd / usdPerDay : Infinity;
    const monthlyBudgetUsed = budgetUsd > 0 ? usdPerMonth / budgetUsd : 0;
    return {
      costWithCache, costNoCache, savings, hourlyCost, fiveHour,
      usdPerPrompt, usdPerDay, usdPerMonth, runwayDays, monthlyBudgetUsed,
    };
  }, [inputTokens, cachedPct, outputTokens, promptsPerHour, budgetUsd, hoursPerDay, daysPerMonth, effectiveInputRate, effectiveOutputRate, effectiveOutputWeight]);

  const overBudget = stats.usdPerMonth > budgetUsd;

  return (
    <section className="hig-elevated p-6 sm:p-8 fade-up" data-testid="token-economy-calculator" aria-labelledby="calc-title">
      <div className="flex flex-wrap items-start gap-4 mb-5">
        <div className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: "var(--brand-soft)" }}>
          <Zap className="w-5 h-5" style={{ color: "var(--brand)" }} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-[220px]">
          <h2 id="calc-title" className="hig-title-3 text-primary-c">
            {mode === "monthly" ? "Will your plan last the month?" : "What a prompt actually costs"}
          </h2>
          <p className="hig-footnote mt-1">
            {mode === "monthly"
              ? "Project a monthly spend from your typical session, in USD. Caching discounts input tokens; output tokens count 5x."
              : "Model-agnostic estimate. Input tokens from cache cost about 10% of fresh ones. Output tokens are the real drain."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode toggle */}
          <div role="group" aria-label="Calculator mode" className="inline-flex p-1 rounded-[10px] border border-c bg-[var(--bg-card-hover)]">
            <button
              type="button"
              onClick={() => setMode("prompt")}
              aria-pressed={mode === "prompt"}
              data-testid="calc-mode-prompt"
              className={cn(
                "flex items-center gap-1.5 px-3 h-8 rounded-[8px] text-[13px] font-medium transition-all",
                mode === "prompt" ? "bg-[var(--bg-card)] text-primary-c shadow-[var(--shadow-elev-1)]" : "text-secondary-c"
              )}
            >
              <Zap className="w-3.5 h-3.5" aria-hidden="true" /> Per prompt
            </button>
            <button
              type="button"
              onClick={() => setMode("monthly")}
              aria-pressed={mode === "monthly"}
              data-testid="calc-mode-monthly"
              className={cn(
                "flex items-center gap-1.5 px-3 h-8 rounded-[8px] text-[13px] font-medium transition-all",
                mode === "monthly" ? "bg-[var(--bg-card)] text-primary-c shadow-[var(--shadow-elev-1)]" : "text-secondary-c"
              )}
            >
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" /> Monthly plan
            </button>
          </div>
          {savedAt && (
            <span className="hig-footnote inline-flex items-center gap-1.5" data-testid="calc-saved-indicator">
              <Save className="w-3.5 h-3.5" aria-hidden="true" />
              {savedAt === "loaded" ? "Your scenario" : "Auto-saved"}
            </span>
          )}
          <button
            type="button"
            onClick={resetDefaults}
            data-testid="calc-reset-button"
            className="hig-btn hig-btn-secondary"
            aria-label="Reset calculator to defaults"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" /> Reset
          </button>
        </div>
      </div>

      {/* Preset buttons */}
      <div className="mb-6">
        <div className="hig-footnote mb-2">Load a realistic preset</div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Calculator presets">
          {PRESETS.map((p) => {
            const isActive = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                data-testid={`calc-preset-${p.id}`}
                aria-pressed={isActive}
                className={cn(
                  "group relative text-left px-3.5 py-2.5 rounded-[12px] border transition-all",
                  isActive ? "border-transparent" : "border-c hover:bg-[var(--bg-card-hover)]"
                )}
                style={isActive ? { background: p.accent + "22", borderColor: p.accent } : undefined}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.accent, boxShadow: isActive ? `0 0 10px ${p.accent}` : "none" }} />
                  <span className="hig-headline text-primary-c">{p.label}</span>
                </span>
                <span className="block hig-footnote mt-0.5">{p.hint}</span>
              </button>
            );
          })}
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

      {mode === "monthly" && (
        <div className="pt-5 border-t border-c mb-6" data-testid="monthly-fields">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-4">
            <Field
              label="Monthly budget"
              hint="Your plan's $ cap (e.g. Claude Team $25)"
              value={budgetUsd} min={5} max={500} step={5} suffix=" $"
              onChange={setBudgetUsd}
              testId="calc-budget"
            />
            {/* Model dropdown replaces the raw $/1M rate slider */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <label htmlFor="calc-model" className="hig-headline text-primary-c">Model</label>
                <span className="text-[13px] font-mono text-primary-c" data-testid="calc-model-rate">
                  ${effectiveInputRate.toFixed(2)} / ${effectiveOutputRate.toFixed(2)}
                </span>
              </div>
              <select
                id="calc-model"
                data-testid="calc-model-select"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="w-full h-10 px-3 rounded-[10px] border border-c surface-card text-primary-c text-[14px] outline-none focus:border-bright-c transition-colors"
                aria-describedby="calc-model-hint"
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}{m.id === "custom" ? "" : ` ($${m.input}/${m.output} per 1M)`}
                  </option>
                ))}
              </select>
              <div id="calc-model-hint" className="hig-footnote mt-1 flex items-center gap-1.5 flex-wrap" data-testid="pricing-freshness">
                <span>Input / output rate per 1M tokens</span>
                {selectedModel.vendor !== "You" && <span>· {selectedModel.vendor}</span>}
                {modelId !== "custom" && (
                  livePricing.source === "live" || livePricing.source === "mixed" ? (
                    <span className="hig-chip" style={{ background: "rgba(48,209,88,0.14)", borderColor: "transparent", color: "var(--success)" }} title={livePricing.source_url || "LiteLLM community pricing"}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--success)" }} />
                      Live prices{livePricing.fetched_at ? ` · refreshed ${new Date(livePricing.fetched_at).toLocaleDateString()}` : ""}
                    </span>
                  ) : (
                    <span className="hig-chip" title={pricingError || "Using built-in rates"}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--text-muted)" }} />
                      Built-in rates
                    </span>
                  )
                )}
              </div>
            </div>
            <Field
              label="Hours active / day"
              hint="How long the agent is really working"
              value={hoursPerDay} min={1} max={12} step={1} suffix=" h"
              onChange={setHoursPerDay}
              testId="calc-hours"
            />
            <Field
              label="Active days / month"
              hint="Working days you'll run these prompts"
              value={daysPerMonth} min={1} max={31} step={1} suffix=" d"
              onChange={setDaysPerMonth}
              testId="calc-days"
            />
          </div>

          {modelId === "custom" && (
            <div className="grid sm:grid-cols-2 gap-5" data-testid="custom-rate-fields">
              <Field
                label="$ per 1M input tokens"
                hint="Vendor's list rate for input"
                value={customInputRate} min={0.1} max={30} step={0.1} suffix=" $"
                onChange={setCustomInputRate}
                testId="calc-custom-input-rate"
              />
              <Field
                label="$ per 1M output tokens"
                hint="Usually 3-8x the input rate"
                value={customOutputRate} min={0.1} max={120} step={0.5} suffix=" $"
                onChange={setCustomOutputRate}
                testId="calc-custom-output-rate"
              />
            </div>
          )}
        </div>
      )}

      {mode === "prompt" ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="stats-prompt">
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
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="stats-monthly">
          <Stat
            label="$ per prompt"
            value={fmtUsd(stats.usdPerPrompt)}
            tone="neutral"
            testId="stat-usd-prompt"
            icon={<DollarSign className="w-4 h-4" aria-hidden="true" />}
          />
          <Stat
            label="$ per day"
            value={fmtUsd(stats.usdPerDay)}
            tone="muted"
            testId="stat-usd-day"
          />
          <Stat
            label="Monthly spend"
            value={fmtUsd(stats.usdPerMonth)}
            tone={overBudget ? "warning" : "positive"}
            testId="stat-usd-month"
            icon={<Calendar className="w-4 h-4" aria-hidden="true" />}
          />
          <Stat
            label={overBudget ? "Days until cap" : "Months of runway"}
            value={
              overBudget
                ? (stats.runwayDays >= 1 ? Math.floor(stats.runwayDays) + "d" : "<1d")
                : (stats.monthlyBudgetUsed > 0 ? (1 / stats.monthlyBudgetUsed).toFixed(1) + "mo" : "∞")
            }
            tone={overBudget ? "warning" : "positive"}
            testId="stat-runway"
            icon={<Flame className="w-4 h-4" aria-hidden="true" />}
          />
        </div>
      )}

      {/* Monthly-mode budget bar */}
      {mode === "monthly" && (
        <div className="mt-5" data-testid="budget-bar-wrap" aria-live="polite">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="hig-footnote">
              You've projected <strong className="text-primary-c">{fmtUsd(stats.usdPerMonth)}</strong> against your <strong className="text-primary-c">{fmtUsd(budgetUsd)}</strong> cap.
            </span>
            <span className="hig-footnote">
              {overBudget
                ? <span style={{ color: "var(--warning)" }}>Over by {fmtUsd(stats.usdPerMonth - budgetUsd)}</span>
                : <span style={{ color: "var(--success)" }}>Under by {fmtUsd(budgetUsd - stats.usdPerMonth)}</span>}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: "var(--bg-card-hover)" }} role="progressbar"
               aria-valuenow={Math.min(100, Math.round(stats.monthlyBudgetUsed * 100))} aria-valuemin={0} aria-valuemax={100}
               aria-label="Monthly budget used">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${Math.min(100, stats.monthlyBudgetUsed * 100)}%`,
                background: overBudget ? "var(--warning)" : "var(--success)",
              }}
            />
          </div>
        </div>
      )}

      <p className="hig-footnote mt-5 flex items-start gap-2">
        <InfinityIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          {mode === "monthly"
            ? <>Monthly $ math uses <strong className="text-primary-c">{selectedModel.label}</strong>'s rates ({`$${effectiveInputRate}/$${effectiveOutputRate} per 1M, input and output`}). Prices approximate as of early 2026. Check the vendor page before committing.</>
            : <>A well-cached session with concise outputs can run <strong className="text-primary-c">5 to 10x longer</strong> on the same usage cap than an un-cached verbose one.</>}
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

/* -------- Agent comparison table ----------- */

const COMPARISON_ROWS = [
  { label: "Cache mechanism", values: {
    claude: "Stable prefix hash (Projects, instructions, files, prior turns)",
    copilot: "Repo and open-file index with the Chat preamble",
    codex: "System prompt, sandbox snapshot, AGENTS.md",
    antigravity: "Workflow graph and MCP tool descriptions",
  } },
  { label: "Cache TTL", values: {
    claude: "5 min default, 1 hr with extended TTL",
    copilot: "Session-scoped (as long as the workspace is open)",
    codex: "Session-scoped (until compact or reset)",
    antigravity: "Plan-scoped (resets on plan edit)",
  } },
  { label: "Cached input discount", values: {
    claude: "About 90% off list price",
    copilot: "Flat seat pricing (no per-token)",
    codex: "About 90% off list price",
    antigravity: "About 90% off list price",
  } },
  { label: "Output token weight", values: {
    claude: "4 to 7x the input rate",
    copilot: "Seat-capped. No direct metering.",
    codex: "4 to 5x the input rate",
    antigravity: "4 to 6x the input rate",
  } },
  { label: "Biggest cache killer", values: {
    claude: "Editing project instructions or swapping files",
    copilot: "Renaming or moving files mid-session",
    codex: "Toggling MCP tools or editing AGENTS.md",
    antigravity: "Editing the plan while it runs",
  } },
  { label: "How to compact", values: {
    claude: "/compact in Claude Code",
    copilot: "Close and re-open the chat panel (no built-in compact)",
    codex: "codex summary or compact pass",
    antigravity: "Agent-driven summary step in the plan",
  } },
  { label: "Best fit", values: {
    claude: "Long, exploratory sessions on a stable repo",
    copilot: "Short surgical edits across many files",
    codex: "Scripted or autonomous CLI work with tests",
    antigravity: "Multi-step agentic workflows",
  } },
];

const COMPARISON_COLS = [
  { id: "claude", label: "Claude / Code", accent: "#D97757" },
  { id: "copilot", label: "GitHub Copilot", accent: "#1F6FEB" },
  { id: "codex", label: "OpenAI Codex", accent: "#10A37F" },
  { id: "antigravity", label: "Antigravity", accent: "#4285F4" },
];

const AgentComparison = () => (
  <section className="mt-10 fade-up" aria-labelledby="comparison-title" data-testid="agent-comparison">
    <div className="flex items-center gap-2 mb-4">
      <Table2 className="w-5 h-5" style={{ color: "var(--brand)" }} aria-hidden="true" />
      <h2 id="comparison-title" className="hig-title-3 text-primary-c">Agents side-by-side</h2>
    </div>
    <p className="hig-footnote mb-4 max-w-2xl">
      Qualitative snapshot of how the main agentic tools handle caching and output economics. Numeric multipliers are rough. Always check the current pricing page before committing to a plan.
    </p>
    <div className="hig-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-c">
              <th scope="col" className="px-5 py-3.5 hig-footnote font-semibold text-primary-c sticky left-0 bg-[var(--bg-card)] z-10 min-w-[180px]">
                Dimension
              </th>
              {COMPARISON_COLS.map((c) => (
                <th scope="col" key={c.id} className="px-5 py-3.5 hig-footnote font-semibold text-primary-c min-w-[200px]">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: c.accent, boxShadow: `0 0 8px ${c.accent}80` }} />
                    {c.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row, i) => (
              <tr
                key={row.label}
                className={cn("border-b border-c last:border-b-0 align-top", i % 2 === 1 && "bg-[var(--bg-card-hover)]")}
                data-testid={`comparison-row-${row.label.replace(/\W+/g, "-").toLowerCase()}`}
              >
                <th scope="row" className="px-5 py-3.5 hig-callout font-medium text-primary-c sticky left-0 bg-inherit">
                  {row.label}
                </th>
                {COMPARISON_COLS.map((c) => (
                  <td key={c.id} className="px-5 py-3.5 hig-callout text-secondary-c">
                    {row.values[c.id]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

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
          The principles below apply to any agentic AI tool (Claude, Copilot, Codex, Antigravity, or your own MCP stack).
          Caching discounts input tokens by about 90%, but only if you treat the top of your context as sacred.
        </p>
      </div>

      <Calculator />

      <div className="mt-10">
        <Tabs active={active} setActive={setActive} />
        <TabPanel id={active} content={TAB_CONTENT[active]} />
      </div>

      <AgentCallouts active={active} />

      <AgentComparison />

      {/* Final trap */}
      <section className="mt-10 hig-card p-6 fade-up" aria-labelledby="trap-title">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(255,159,10,0.14)" }}>
            <AlertTriangle className="w-5 h-5" style={{ color: "var(--warning)" }} aria-hidden="true" />
          </div>
          <div>
            <h2 id="trap-title" className="hig-title-3 text-primary-c">The one trap caching cannot fix</h2>
            <p className="hig-body text-secondary-c mt-2 max-w-3xl">
              Caching only discounts <strong className="text-primary-c">input</strong> tokens.
              Output tokens cost full price and drain usage caps roughly <strong className="text-primary-c">4 to 7x faster</strong> than input.
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
