/* © 2026 Ayanjit Shome. All rights reserved. Concept by Ayanjit Shome. */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTools, useMeta } from "@/hooks/useData";
import { CodeBlock } from "@/components/CodeBlock";
import { platformIcon } from "@/lib/icons";
import { AGENTS, buildPrompt } from "@/lib/promptData";
import { countTokens, estimateTokens } from "@/lib/tokenizer";
import { Sparkles, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PromptBuilder() {
  const { data: tools = [] } = useTools();
  const { data: meta } = useMeta();
  const platforms = meta?.platforms || [];

  const [task, setTask] = useState("");
  const [languages, setLanguages] = useState("");
  const [platform, setPlatform] = useState("iOS");
  const [agent, setAgent] = useState("claude");
  const [activeIds, setActiveIds] = useState([]);
  const [constraints, setConstraints] = useState("");
  const [output, setOutput] = useState("");
  const [validation, setValidation] = useState("");

  useEffect(() => {
    if (tools.length) setActiveIds(tools.map((t) => t.id));
  }, [tools]);

  const agentObj = AGENTS.find((a) => a.v === agent) || AGENTS[0];
  const prompt = useMemo(
    () => buildPrompt({ task, languages, platform, agentLabel: agentObj.l, agentEnv: agentObj.env, agentNote: agentObj.note, activeIds, tools, constraints, output, validation }),
    [task, languages, platform, agentObj, activeIds, tools, constraints, output, validation]
  );

  // Real BPE count once the encoder lazy-loads; fall back to chars/4 while
  // it's in flight so the chip never flashes "0" on first paint.
  const [tokenCount, setTokenCount] = useState(() => estimateTokens(prompt));
  const [isExactTokens, setIsExactTokens] = useState(false);
  const reqRef = useRef(0);
  useEffect(() => {
    const myReq = ++reqRef.current;
    setIsExactTokens(false);
    setTokenCount(estimateTokens(prompt));
    let cancelled = false;
    countTokens(prompt).then((n) => {
      if (cancelled || myReq !== reqRef.current) return;
      setTokenCount(n);
      setIsExactTokens(true);
    });
    return () => { cancelled = true; };
  }, [prompt]);

  const toggleTool = (id) =>
    setActiveIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const inputCls = "w-full surface-card border border-c rounded-lg px-3.5 py-2.5 text-sm text-primary-c placeholder:text-muted-c outline-none focus:border-bright-c transition-colors";

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 fade-up" data-testid="prompt-builder-page">
      <Link to="/prompt" data-testid="builder-back-link" className="inline-flex items-center gap-1.5 text-sm text-muted-c hover:text-primary-c mb-5">
        <ArrowLeft className="w-4 h-4" /> Prompt Playbook
      </Link>

      <div className="text-xs uppercase tracking-[0.25em] font-semibold mb-3 flex items-center gap-2" style={{ color: "#F59E0B" }}>
        <Sparkles className="w-4 h-4" aria-hidden="true" /> {"// prompt builder"}
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-primary-c">Build your prompt</h1>
      <p className="text-secondary-c mt-2 max-w-2xl">Fill these in and the structured, copy-ready prompt updates live. Need a refresher on the structure? See the <Link to="/prompt" className="underline" style={{ color: "#F59E0B" }}>Prompt Playbook</Link>.</p>

      <div className="grid lg:grid-cols-2 gap-6 mt-7">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label htmlFor="builder-task" className="text-xs uppercase tracking-wider text-muted-c">Role, task &amp; objective</label>
            <textarea id="builder-task" data-testid="builder-task-input" value={task} onChange={(e) => setTask(e.target.value)} rows={3}
              placeholder="As a <role>, <define the task> to <define the objective>" className={cn(inputCls, "mt-1.5 resize-y")} />
          </div>

          <div>
            <span id="builder-tools-label" className="text-xs uppercase tracking-wider text-muted-c">Active context tools</span>
            <div className="grid grid-cols-2 gap-2 mt-1.5" role="group" aria-labelledby="builder-tools-label">
              {tools.map((t) => {
                const on = activeIds.includes(t.id);
                return (
                  <button key={t.id} data-testid={`builder-tool-${t.id}`} onClick={() => toggleTool(t.id)} aria-pressed={on}
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
              <label htmlFor="builder-languages" className="text-xs uppercase tracking-wider text-muted-c">Language(s)</label>
              <input id="builder-languages" data-testid="builder-languages-input" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="TypeScript, Python" className={cn(inputCls, "mt-1.5")} />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="builder-agent" className="text-xs uppercase tracking-wider text-muted-c">AI agent</label>
                <span
                  className="hig-chip hig-chip-accent"
                  data-testid="builder-token-count"
                  title={isExactTokens
                    ? `BPE token count (o200k_base) — ${prompt.length.toLocaleString()} characters`
                    : `Loading tokenizer… showing ~chars/4 estimate (${prompt.length.toLocaleString()} chars)`}
                >
                  {isExactTokens ? "" : "~"}{tokenCount.toLocaleString()} tokens
                </span>
              </div>
              <select id="builder-agent" data-testid="builder-agent-select" value={agent} onChange={(e) => setAgent(e.target.value)} className={cn(inputCls, "mt-1.5")}>
                {AGENTS.map((a) => <option key={a.v} value={a.v}>{a.l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <span id="builder-platform-label" className="text-xs uppercase tracking-wider text-muted-c">Platform</span>
            <div className="flex flex-wrap gap-2 mt-1.5" role="group" aria-labelledby="builder-platform-label">
              {platforms.map((p) => {
                const Icon = platformIcon(p.id);
                const on = platform === p.name;
                return (
                  <button key={p.id} data-testid={`builder-platform-${p.id}`} onClick={() => setPlatform(p.name)} aria-pressed={on}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors", on ? "text-primary-c" : "text-muted-c border-c hover:text-secondary-c")}
                    style={on ? { borderColor: "var(--brand)", background: "rgba(16,185,129,0.12)" } : {}}>
                    <Icon className="w-3.5 h-3.5" /> {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="builder-constraints" className="text-xs uppercase tracking-wider text-muted-c">Constraints <span className="text-muted-c normal-case">(one per line, optional)</span></label>
            <textarea id="builder-constraints" data-testid="builder-constraints-input" value={constraints} onChange={(e) => setConstraints(e.target.value)} rows={2}
              placeholder={"Don't touch the auth module\nKeep public API backwards-compatible"} className={cn(inputCls, "mt-1.5 resize-y")} />
          </div>

          <div>
            <label htmlFor="builder-output" className="text-xs uppercase tracking-wider text-muted-c">Expected output <span className="text-muted-c normal-case">(optional)</span></label>
            <textarea id="builder-output" data-testid="builder-output-input" value={output} onChange={(e) => setOutput(e.target.value)} rows={3}
              placeholder="Plan first, then a unified diff" className={cn(inputCls, "mt-1.5 resize-y")} />
          </div>

          <div>
            <label htmlFor="builder-validation" className="text-xs uppercase tracking-wider text-muted-c">Validation <span className="text-muted-c normal-case">(one check per line, optional)</span></label>
            <textarea id="builder-validation" data-testid="builder-validation-input" value={validation} onChange={(e) => setValidation(e.target.value)} rows={3}
              placeholder={"Does the change stay inside the provided context scope?\nIs this the smallest change that meets the objective?"} className={cn(inputCls, "mt-1.5 resize-y")} />
          </div>
        </div>

        {/* Live output */}
        <div className="lg:sticky lg:top-4 self-start">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-c">Generated prompt</span>
            <span className="text-[10px] text-muted-c" data-testid="prompt-size-chip">{isExactTokens ? "" : "~"}{tokenCount.toLocaleString()} tokens · {prompt.length.toLocaleString()} chars</span>
          </div>
          <div data-testid="generated-prompt">
            <CodeBlock code={prompt} label="prompt.md" testId="copy-generated-prompt-button" />
          </div>
        </div>
      </div>
    </div>
  );
}
