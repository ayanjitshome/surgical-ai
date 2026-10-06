import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { postDecision } from "@/lib/api";
import { ArrowLeft, ArrowRight, Compass, Sparkles, TrendingDown, RotateCcw, Check, Settings2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const QUESTIONS = [
  {
    key: "repo_size", label: "How big is your repository?", type: "single",
    options: [
      { v: "small", l: "Small", d: "< 10k LOC, single service" },
      { v: "medium", l: "Medium", d: "10k-100k LOC" },
      { v: "large", l: "Large", d: "100k-500k LOC, multi-package" },
      { v: "huge", l: "Huge", d: "> 500k LOC, monorepo" },
    ],
  },
  {
    key: "languages", label: "Which languages are in play?", type: "multi",
    options: [
      { v: "typescript", l: "TypeScript" }, { v: "python", l: "Python" }, { v: "go", l: "Go" },
      { v: "rust", l: "Rust" }, { v: "java", l: "Java" }, { v: "csharp", l: "C#" },
      { v: "ruby", l: "Ruby" }, { v: "php", l: "PHP" }, { v: "cpp", l: "C/C++" },
    ],
  },
  {
    key: "team_size", label: "Who works in this repo?", type: "single",
    options: [
      { v: "solo", l: "Just me", d: "Solo developer" },
      { v: "small-team", l: "Small team", d: "2-8 contributors" },
      { v: "large-team", l: "Large team", d: "9+ contributors" },
    ],
  },
  {
    key: "agent", label: "Which AI coding agent do you use?", type: "single",
    options: [
      { v: "claude", l: "Claude", d: "Sonnet / Opus" },
      { v: "copilot", l: "GitHub Copilot", d: "GPT-based" },
      { v: "codex", l: "Codex", d: "OpenAI" },
      { v: "antigravity", l: "Antigravity", d: "Agentic IDE" },
    ],
  },
  {
    key: "cost_sensitivity", label: "How cost-sensitive are you?", type: "single",
    options: [
      { v: "low", l: "Relaxed", d: "Tokens aren't a concern" },
      { v: "medium", l: "Mindful", d: "Want reasonable efficiency" },
      { v: "high", l: "Very sensitive", d: "Every token counts" },
    ],
  },
];

export default function Decide() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ repo_size: "", languages: [], team_size: "", agent: "", cost_sensitivity: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const q = QUESTIONS[step];
  const value = answers[q?.key];
  const canProceed = q?.type === "multi" ? value?.length > 0 : !!value;

  const select = (v) => {
    if (q.type === "multi") {
      setAnswers((a) => {
        const list = a[q.key].includes(v) ? a[q.key].filter((x) => x !== v) : [...a[q.key], v];
        return { ...a, [q.key]: list };
      });
    } else {
      setAnswers((a) => ({ ...a, [q.key]: v }));
    }
  };

  const submit = async () => {
    setLoading(true);
    try {
      const r = await postDecision(answers);
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setStep(0); setAnswers({ repo_size: "", languages: [], team_size: "", agent: "", cost_sensitivity: "" }); };

  if (result) {
    return (
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 fade-up" data-testid="decision-result">
        <div className="font-mono text-xs uppercase tracking-[0.25em] font-semibold mb-3" style={{ color: "#10B981" }}>{"// your recommended stack"}</div>
        <div className="rounded-2xl border border-bright-c surface-secondary p-6 relative overflow-hidden">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(16,185,129,0.15)" }}>
              <TrendingDown className="w-8 h-8" style={{ color: "#10B981" }} />
            </div>
            <div>
              <div className="font-mono text-4xl font-bold text-primary-c">~{result.estimated_savings_pct}%</div>
              <div className="text-secondary-c text-sm">estimated token-waste reduction with this stack</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-5">
            {result.adoption_order.map((id, i) => {
              const t = result.tools.find((x) => x.id === id);
              return (
                <div key={id} className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5" style={{ color: t.color, borderColor: `${t.color}66` }}>
                    <span className="text-muted-c">{i + 1}.</span> {t.name}
                  </span>
                  {i < result.adoption_order.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-muted-c" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 mt-6">
          {result.tools.map((t, i) => (
            <div key={t.id} className="surface-card border border-c rounded-xl p-4 fade-up" style={{ animationDelay: `${i * 60}ms` }} data-testid={`recommendation-${t.id}`}>
              <div className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-mono font-bold text-lg text-primary-c">{t.name}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full border" style={{ color: t.color, borderColor: `${t.color}55` }}>{t.layer_name}</span>
                  </div>
                  <p className="text-sm text-secondary-c mt-1 leading-relaxed">{result.reasons[t.id]}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => navigate(`/tools/${t.id}`)} data-testid={`rec-learn-${t.id}`} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-c text-primary-c hover:surface-card"><BookOpen className="w-3.5 h-3.5" /> Learn</button>
                    <button onClick={() => navigate(`/tools/${t.id}/setup`)} data-testid={`rec-setup-${t.id}`} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-semibold text-black" style={{ background: t.color }}><Settings2 className="w-3.5 h-3.5" /> Set Up</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-7">
          <button onClick={reset} data-testid="decision-restart-button" className="flex items-center gap-1.5 px-5 py-2.5 rounded-md border border-bright-c text-primary-c hover:surface-card"><RotateCcw className="w-4 h-4" /> Start over</button>
          <button onClick={() => navigate("/guidance")} data-testid="decision-tradeoffs-button" className="flex items-center gap-1.5 px-5 py-2.5 rounded-md font-semibold text-black" style={{ background: "#10B981" }}>See tradeoffs & cost playbook <ArrowRight className="w-4 h-4" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10 fade-up" data-testid="decision-questionnaire">
      <div className="flex items-center justify-between mb-6">
        <span className="font-mono text-xs uppercase tracking-[0.25em] font-semibold flex items-center gap-2" style={{ color: "#06B6D4" }}>
          <Compass className="w-4 h-4" /> which tools do i need?
        </span>
        <span className="font-mono text-xs text-muted-c">{step + 1} / {QUESTIONS.length}</span>
      </div>

      <div className="h-1 rounded-full surface-card mb-8 overflow-hidden" role="progressbar" aria-valuemin={1} aria-valuemax={QUESTIONS.length} aria-valuenow={step + 1} aria-valuetext={`Question ${step + 1} of ${QUESTIONS.length}`}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%`, background: "#06B6D4" }} aria-hidden="true" />
      </div>

      <h1 className="font-mono text-2xl sm:text-3xl font-bold text-primary-c mb-1.5">{q.label}</h1>
      <p className="text-sm text-muted-c mb-6">{q.type === "multi" ? "Select all that apply." : "Pick one."}</p>

      <div className={cn("grid gap-3", q.type === "multi" ? "grid-cols-2 sm:grid-cols-3" : "sm:grid-cols-2")} role="group" aria-label={q.label}>
        {q.options.map((opt) => {
          const active = q.type === "multi" ? value.includes(opt.v) : value === opt.v;
          return (
            <button key={opt.v} data-testid={`decision-option-${q.key}-${opt.v}`} onClick={() => select(opt.v)} aria-pressed={active}
              className={cn("text-left surface-card border rounded-xl p-4 transition-all relative", active ? "border-bright-c" : "border-c hover:border-bright-c")}
              style={active ? { borderColor: "#06B6D4", boxShadow: "0 0 16px rgba(6,182,212,0.2)" } : {}}>
              {active && <Check className="w-4 h-4 absolute top-3 right-3" style={{ color: "#06B6D4" }} />}
              <div className="font-medium text-primary-c">{opt.l}</div>
              {opt.d && <div className="text-xs text-muted-c mt-0.5">{opt.d}</div>}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-9 pt-5 border-t border-c">
        <button onClick={() => (step === 0 ? navigate("/") : setStep((s) => s - 1))} data-testid="decision-back-button" className="flex items-center gap-1.5 px-4 py-2.5 rounded-md border border-bright-c text-primary-c hover:surface-card">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        {step < QUESTIONS.length - 1 ? (
          <button onClick={() => setStep((s) => s + 1)} disabled={!canProceed} data-testid="decision-next-button" className="flex items-center gap-1.5 px-5 py-2.5 rounded-md font-semibold text-black disabled:opacity-40" style={{ background: "#06B6D4" }}>
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={submit} disabled={!canProceed || loading} data-testid="decision-submit-button" className="flex items-center gap-1.5 px-5 py-2.5 rounded-md font-semibold text-black disabled:opacity-40" style={{ background: "#10B981" }}>
            <Sparkles className="w-4 h-4" /> {loading ? "Calculating…" : "Get my stack"}
          </button>
        )}
      </div>
    </div>
  );
}
