import { useTools } from "@/hooks/useData";
import { Link } from "react-router-dom";
import { TOOL_DIRECTIVES } from "@/lib/promptData";
import { Wand2, ListTree, Target, BookMarked, ShieldCheck, FileOutput, CheckCircle2, Layers, Terminal, Sparkles, ArrowRight } from "lucide-react";

const ANATOMY = [
  { id: "role", icon: Target, title: "1 . Role & Objective", color: "#10B981",
    body: "Open by naming the agent's role and the single, concrete objective. One task per prompt, ambiguity here is the most expensive kind of token waste because it causes wrong work and rework." },
  { id: "context", icon: Layers, title: "2 . Available Context (tool-provided)", color: "#06B6D4",
    body: "Explicitly tell the agent what its tooling already provides and to rely on it rather than rebuilding it. This is the heart of a tool-aware prompt: each active tool gets one directive so the agent uses the graph, the memory and the budget instead of brute-forcing the repo." },
  { id: "repo", icon: ListTree, title: "3 . Repository Facts", color: "#8B5CF6",
    body: "State the primary languages and target platform. This lets the agent pick the right structural queries (Graphify grammars) and platform-correct commands without guessing." },
  { id: "constraints", icon: ShieldCheck, title: "4 . Constraints", color: "#EC4899",
    body: "Encode the hard rules: smallest-change principle, files not to touch, architectural invariants. Front-loading constraints is what Archify automates, doing it in the prompt too prevents rejected diffs." },
  { id: "output", icon: FileOutput, title: "5 . Expected Output", color: "#F59E0B",
    body: "Define the exact shape of a good answer (unified diff? a plan first? which files?). A precise output contract stops the agent from over-producing, directly saving output tokens." },
  { id: "validation", icon: CheckCircle2, title: "6 . Validation Checklist", color: "#3B82F6",
    body: "Give the agent a self-check to run before responding. This mirrors the wizard's validation checkpoints and catches violations before they cost you a correction round-trip." },
];

export default function PromptPlaybook() {
  const { data: tools = [] } = useTools();

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
          Your tools only save tokens if the agent is told to use them. A context-aware prompt names what each tool already provides and forbids the agent from brute-forcing the repo. Below is the anatomy, then jump into the builder to generate your own.
        </p>
        <Link to="/prompt/builder" data-testid="playbook-open-builder-button" className="inline-flex items-center gap-2 mt-5 px-5 py-3 rounded-md font-semibold text-black transition-transform hover:scale-[1.03]" style={{ background: "#F59E0B" }}>
          <Sparkles className="w-4.5 h-4.5" /> Open the Prompt Builder <ArrowRight className="w-4 h-4" />
        </Link>
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
                <div className="font-mono font-semibold text-primary-c text-sm">{t.name} <span className="text-muted-c font-normal">. {t.layer_name}</span></div>
                <p className="text-sm text-secondary-c mt-0.5 leading-relaxed">{TOOL_DIRECTIVES[t.id]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Builder CTA */}
      <section>
        <div className="surface-card border border-c rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ borderColor: "rgba(245,158,11,0.4)" }}>
          <div>
            <h3 className="font-mono text-lg font-bold text-primary-c flex items-center gap-2"><Sparkles className="w-5 h-5" style={{ color: "#F59E0B" }} /> Ready to write one?</h3>
            <p className="text-sm text-secondary-c mt-1">Use the interactive builder to assemble a copy-ready prompt from your task, active tools and platform.</p>
          </div>
          <Link to="/prompt/builder" data-testid="playbook-builder-cta" className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-md font-semibold text-black" style={{ background: "#F59E0B" }}>
            Open Prompt Builder <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
