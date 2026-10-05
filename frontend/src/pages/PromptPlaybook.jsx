import { useEffect, useMemo, useState } from "react";
import { useTools, useMeta } from "@/hooks/useData";
import { CodeBlock } from "@/components/CodeBlock";
import { platformIcon } from "@/lib/icons";
import { Wand2, ListTree, Target, BookMarked, ShieldCheck, FileOutput, CheckCircle2, Layers, Terminal, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Per-tool directive the agent should be told to honour when the tool is active.
const TOOL_DIRECTIVES = {
  graft: "Treat the grafted file slice as the complete scope. Do not request files outside it - if something essential seems missing, say so instead of pulling the whole repo.",
  serena: "Stay within the token budget. Fetch specific symbols/functions via retrieval rather than pasting whole files, and keep your answer focused on the task.",
  graphify: "Resolve \"where is X defined / used\" through the structural graph (symbols, call edges, imports) - never full-text grep or read many files to find them.",
  "codebase-memory": "Consult persistent memory for existing conventions and prior decisions before asking. Record any new architectural decision you make so future sessions inherit it.",
  archify: "Obey the injected architectural invariants and layering rules. Every proposed change must pass `archify check`; do not introduce cross-layer imports.",
  agentsview: "This session's token usage is measured. Prefer the smallest sufficient context, avoid restating the obvious, and flag any step that would blow the budget.",
};

const ANATOMY = [
  { id: "role", icon: Target, title: "1 · Role & Objective", color: "#10B981",
    body: "Open by naming the agent's role and the single, concrete objective. One task per prompt - ambiguity here is the most expensive kind of token waste because it causes wrong work and rework." },
  { id: "context", icon: Layers, title: "2 · Available Context (tool-provided)", color: "#06B6D4",
    body: "Explicitly tell the agent what its tooling already provides and to rely on it rather than rebuilding it. This is the heart of a tool-aware prompt: each active tool gets one directive so the agent uses the graph, the memory and the budget instead of brute-forcing the repo." },
  { id: "repo", icon: ListTree, title: "3 · Repository Facts", color: "#8B5CF6",
    body: "State the primary languages and target platform. This lets the agent pick the right structural queries (Graphify grammars) and platform-correct commands without guessing." },
  { id: "constraints", icon: ShieldCheck, title: "4 · Constraints", color: "#EC4899",
    body: "Encode the hard rules: smallest-change principle, files not to touch, architectural invariants. Front-loading constraints is what Archify automates - doing it in the prompt too prevents rejected diffs." },
  { id: "output", icon: FileOutput, title: "5 · Expected Output", color: "#F59E0B",
    body: "Define the exact shape of a good answer (unified diff? a plan first? which files?). A precise output contract stops the agent from over-producing - directly saving output tokens." },
  { id: "validation", icon: CheckCircle2, title: "6 · Validation Checklist", color: "#3B82F6",
    body: "Give the agent a self-check to run before responding. This mirrors the wizard's validation checkpoints and catches violations before they cost you a correction round-trip." },
];

const AGENTS = [
  { v: "claude", l: "Claude" }, { v: "copilot", l: "Copilot" },
  { v: "codex", l: "Codex" }, { v: "antigravity", l: "Antigravity" },
];

const buildPrompt = ({ task, languages, platform, agentLabel, activeIds, tools, constraints, output }) => {
  const active = tools.filter((t) => activeIds.includes(t.id));
  const contextLines = active.length
    ? active.map((t) => `- **${t.name}** (${t.layer_name}): ${TOOL_DIRECTIVES[t.id]}`).join("\n")
    : "- (no context tools active - work only from what is pasted below)";

  const langLine = languages?.trim() ? languages.trim() : "not specified";
  const constraintLines = (constraints?.trim()
    ? constraints.trim().split("\n").map((l) => `- ${l.replace(/^[-*]\s*/, "")}`).join("\n")
    : "- Make the smallest change that fully satisfies the objective.\n- Do not modify unrelated files or reformat untouched code.");
  const outputLine = output?.trim() ? output.trim() : "A brief plan, then a unified diff limited to the files you change.";

  return `# ROLE & OBJECTIVE
You are an AI coding agent running in VSCode (${agentLabel}). Complete exactly one task, operating strictly within the constraints of the context tools listed below.

**Objective:** ${task?.trim() || "<describe the single concrete task here>"}

# AVAILABLE CONTEXT - rely on your tooling, do not rebuild it
${contextLines}

# REPOSITORY
- Primary language(s): ${langLine}
- Target platform: ${platform}

# CONSTRAINTS
${constraintLines}
- Ask a clarifying question only if truly blocked; otherwise proceed with the most reasonable interpretation and note the assumption.

# EXPECTED OUTPUT
${outputLine}

# VALIDATION - run this checklist before you answer
1. Does the change stay inside the provided context scope (Graft slice)?
2. Did you use the structural graph / memory instead of re-reading files?
3. Does it respect the architectural invariants (no cross-layer imports)?
4. Is this the smallest change that fully meets the objective?
5. Is the output in the exact format requested above?`;
};

export default function PromptPlaybook() {
  const { data: tools = [] } = useTools();
  const { data: meta } = useMeta();
  const platforms = meta?.platforms || [];

  const [task, setTask] = useState("");
  const [languages, setLanguages] = useState("");
  const [platform, setPlatform] = useState("macOS");
  const [agent, setAgent] = useState("claude");
  const [activeIds, setActiveIds] = useState([]);
  const [constraints, setConstraints] = useState("");
  const [output, setOutput] = useState("");

  // default: all tools active once loaded
  useEffect(() => {
    if (tools.length) setActiveIds(tools.map((t) => t.id));
  }, [tools]);

  const agentLabel = AGENTS.find((a) => a.v === agent)?.l || "Claude";
  const prompt = useMemo(
    () => buildPrompt({ task, languages, platform, agentLabel, activeIds, tools, constraints, output }),
    [task, languages, platform, agentLabel, activeIds, tools, constraints, output]
  );

  const toggleTool = (id) =>
    setActiveIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const inputCls = "w-full surface-card border border-c rounded-lg px-3.5 py-2.5 text-sm text-primary-c placeholder:text-muted-c outline-none focus:border-bright-c transition-colors";

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 space-y-14 fade-up" data-testid="prompt-playbook-page">
      {/* Intro */}
      <section>
        <div className="font-mono text-xs uppercase tracking-[0.25em] font-semibold mb-3 flex items-center gap-2" style={{ color: "#10B981" }}>
          <Wand2 className="w-4 h-4" /> // prompt playbook
        </div>
        <h1 className="font-mono text-3xl sm:text-4xl font-bold text-primary-c max-w-3xl">
          Write prompts that <span style={{ color: "#10B981" }}>let the tools do the work</span>.
        </h1>
        <p className="text-secondary-c mt-3 max-w-2xl leading-relaxed">
          Your six tools only save tokens if the agent is told to use them. A context-aware prompt names what each tool already provides and forbids the agent from brute-forcing the repo. Below is the anatomy - then build your own.
        </p>
      </section>

      {/* Anatomy guide */}
      <section data-testid="prompt-anatomy-section">
        <h2 className="font-mono text-2xl font-bold text-primary-c flex items-center gap-2 mb-5"><BookMarked className="w-6 h-6" style={{ color: "#06B6D4" }} /> Anatomy of a context-aware prompt</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {ANATOMY.map((a, i) => (
            <div key={a.id} className="surface-card border border-c rounded-xl p-4 fade-up" style={{ animationDelay: `${i * 50}ms`, borderLeft: `3px solid ${a.color}` }} data-testid={`anatomy-${a.id}`}>
              <div className="flex items-center gap-2 font-mono font-semibold text-primary-c">
                <a.icon className="w-4 h-4" style={{ color: a.color }} /> {a.title}
              </div>
              <p className="text-sm text-secondary-c mt-2 leading-relaxed">{a.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Per-tool directives */}
      <section data-testid="tool-directives-section">
        <h2 className="font-mono text-2xl font-bold text-primary-c flex items-center gap-2 mb-2"><Terminal className="w-6 h-6" style={{ color: "#8B5CF6" }} /> What to tell the agent, per tool</h2>
        <p className="text-secondary-c text-sm mb-5">Drop the matching line into the <span className="font-mono">AVAILABLE CONTEXT</span> block for every tool you have running.</p>
        <div className="space-y-2.5">
          {tools.map((t) => (
            <div key={t.id} className="surface-card border border-c rounded-lg p-4 flex gap-3" data-testid={`directive-${t.id}`}>
              <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }} />
              <div>
                <div className="font-mono font-semibold text-primary-c text-sm">{t.name} <span className="text-muted-c font-normal">· {t.layer_name}</span></div>
                <p className="text-sm text-secondary-c mt-0.5 leading-relaxed">{TOOL_DIRECTIVES[t.id]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive builder */}
      <section data-testid="prompt-builder-section">
        <h2 className="font-mono text-2xl font-bold text-primary-c flex items-center gap-2 mb-1"><Sparkles className="w-6 h-6" style={{ color: "#F59E0B" }} /> Build your prompt</h2>
        <p className="text-secondary-c text-sm mb-5">Fill these in - the structured, copy-ready prompt updates live.</p>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="font-mono text-xs uppercase tracking-wider text-muted-c">Task / objective</label>
              <textarea data-testid="builder-task-input" value={task} onChange={(e) => setTask(e.target.value)} rows={3}
                placeholder="e.g. Add rate-limiting to the public /api/search endpoint" className={cn(inputCls, "mt-1.5 resize-y")} />
            </div>

            <div>
              <label className="font-mono text-xs uppercase tracking-wider text-muted-c">Active context tools</label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {tools.map((t) => {
                  const on = activeIds.includes(t.id);
                  return (
                    <button key={t.id} data-testid={`builder-tool-${t.id}`} onClick={() => toggleTool(t.id)}
                      className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors", on ? "text-primary-c" : "text-muted-c border-c hover:text-secondary-c")}
                      style={on ? { borderColor: t.color, background: `${t.color}14` } : {}}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: on ? t.color : "var(--text-muted)" }} />
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-c">Language(s)</label>
                <input data-testid="builder-languages-input" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="TypeScript, Python" className={cn(inputCls, "mt-1.5")} />
              </div>
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-c">AI agent</label>
                <select data-testid="builder-agent-select" value={agent} onChange={(e) => setAgent(e.target.value)} className={cn(inputCls, "mt-1.5")}>
                  {AGENTS.map((a) => <option key={a.v} value={a.v}>{a.l}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="font-mono text-xs uppercase tracking-wider text-muted-c">Platform</label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {platforms.map((p) => {
                  const Icon = platformIcon(p.id);
                  const on = platform === p.name;
                  return (
                    <button key={p.id} data-testid={`builder-platform-${p.id}`} onClick={() => setPlatform(p.name)}
                      className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors", on ? "text-primary-c" : "text-muted-c border-c hover:text-secondary-c")}
                      style={on ? { borderColor: "#10B981", background: "rgba(16,185,129,0.12)" } : {}}>
                      <Icon className="w-3.5 h-3.5" /> {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="font-mono text-xs uppercase tracking-wider text-muted-c">Constraints <span className="text-muted-c normal-case">(one per line, optional)</span></label>
              <textarea data-testid="builder-constraints-input" value={constraints} onChange={(e) => setConstraints(e.target.value)} rows={2}
                placeholder={"Don't touch the auth module\nKeep public API backwards-compatible"} className={cn(inputCls, "mt-1.5 resize-y")} />
            </div>

            <div>
              <label className="font-mono text-xs uppercase tracking-wider text-muted-c">Expected output <span className="text-muted-c normal-case">(optional)</span></label>
              <input data-testid="builder-output-input" value={output} onChange={(e) => setOutput(e.target.value)} placeholder="Plan first, then a unified diff" className={cn(inputCls, "mt-1.5")} />
            </div>
          </div>

          {/* Live output */}
          <div className="lg:sticky lg:top-4 self-start">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-c">Generated prompt</span>
              <span className="font-mono text-[10px] text-muted-c">{prompt.length} chars</span>
            </div>
            <div data-testid="generated-prompt">
              <CodeBlock code={prompt} label="prompt.md" testId="copy-generated-prompt-button" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
