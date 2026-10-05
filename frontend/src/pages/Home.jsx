import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEcosystem, useTools } from "@/hooks/useData";
import { EcosystemMap } from "@/components/ecosystem/EcosystemMap";
import { stageIcon } from "@/lib/icons";
import { X, ArrowRight, BookOpen, Settings2, Compass, Layers, Zap, TrendingDown, Wand2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const StageLegend = ({ stages }) => (
  <div className="flex flex-wrap gap-2">
    {stages.map((s, i) => {
      const Icon = stageIcon(s.id);
      return (
        <div key={s.id} className="flex items-center gap-1.5 font-mono text-[11px] text-secondary-c px-2.5 py-1 rounded-full border border-c surface-card">
          <span className="text-muted-c">{i + 1}</span>
          <Icon className="w-3.5 h-3.5" style={{ color: "#10B981" }} />
          {s.name}
          {i < stages.length - 1 && <ArrowRight className="w-3 h-3 text-muted-c ml-1" />}
        </div>
      );
    })}
  </div>
);

const NodeDrawer = ({ tool, onClose }) => {
  const navigate = useNavigate();
  if (!tool) return null;
  return (
    <div className="absolute top-0 right-0 bottom-0 w-full sm:w-[380px] surface-secondary border-l border-bright-c z-20 flex flex-col fade-up" data-testid="ecosystem-node-drawer">
      <div className="p-5 border-b border-c">
        <div className="flex items-start justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border" style={{ color: tool.color, borderColor: `${tool.color}66` }}>
            {tool.layer_name}
          </span>
          <button onClick={onClose} data-testid="close-node-drawer" className="p-1 text-muted-c hover:text-primary-c"><X className="w-5 h-5" /></button>
        </div>
        <h3 className="font-mono text-2xl font-bold text-primary-c mt-3">{tool.name}</h3>
        <p className="text-sm text-secondary-c mt-1">{tool.tagline}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Tokens", value: `-${tool.stats.token_saved}`, icon: TrendingDown },
            { label: "Latency", value: tool.stats.latency, icon: Zap },
            { label: "Setup", value: tool.stats.setup_time, icon: Settings2 },
          ].map((s) => (
            <div key={s.label} className="surface-card border border-c rounded-lg p-2.5 text-center">
              <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: tool.color }} />
              <div className="font-mono text-sm font-bold text-primary-c">{s.value}</div>
              <div className="text-[10px] text-muted-c">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-secondary-c leading-relaxed">{tool.overview.split("\n")[0].replace(/\*\*/g, "")}</p>
        <div className="surface-card border border-c rounded-lg p-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-c mb-1">Adoption Note</div>
          <p className="text-xs text-secondary-c leading-relaxed">{tool.adoption_note.replace(/\*\*/g, "")}</p>
        </div>
      </div>
      <div className="p-4 border-t border-c grid grid-cols-2 gap-2">
        <button onClick={() => navigate(`/tools/${tool.id}`)} data-testid="drawer-learn-button" className="flex items-center justify-center gap-1.5 py-2.5 rounded-md border border-bright-c text-sm font-medium text-primary-c hover:surface-card">
          <BookOpen className="w-4 h-4" /> Learn
        </button>
        <button onClick={() => navigate(`/tools/${tool.id}/setup`)} data-testid="drawer-setup-button" className="flex items-center justify-center gap-1.5 py-2.5 rounded-md text-sm font-semibold text-black" style={{ background: tool.color }}>
          <Settings2 className="w-4 h-4" /> Set Up
        </button>
      </div>
    </div>
  );
};

export default function Home() {
  const { data: eco } = useEcosystem();
  const { data: tools = [] } = useTools();
  const [selectedId, setSelectedId] = useState(null);
  const navigate = useNavigate();

  const selectedTool = tools.find((t) => t.id === selectedId);

  return (
    <div className="min-h-full">
      <section className="px-5 sm:px-8 pt-10 pb-6 max-w-6xl mx-auto fade-up">
        <div className="font-mono text-xs uppercase tracking-[0.25em] font-semibold mb-4" style={{ color: "#10B981" }}>
          // internal knowledge product
        </div>
        <h1 className="font-mono text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-primary-c max-w-3xl">
          Orchestrate six tools to <span style={{ color: "#10B981" }}>starve token waste</span> out of your AI agents.
        </h1>
        <p className="text-base text-secondary-c mt-4 max-w-2xl leading-relaxed">
          Opinionated setup & orchestration guidance for Graft, Serena, Graphify, Codebase Memory, Archify and Agentsview - tuned for VSCode agents across Mac, Windows, WSL, containers, remote SSH and locked-down corporate machines.
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-6">
          <button onClick={() => navigate("/decide")} data-testid="hero-get-started-button" className="flex items-center gap-2 px-5 py-3 rounded-md font-semibold text-black transition-transform hover:scale-[1.03]" style={{ background: "#10B981" }}>
            <Compass className="w-4.5 h-4.5" /> Which tools do I need?
          </button>
          <button onClick={() => navigate("/guidance")} data-testid="hero-adoption-button" className="flex items-center gap-2 px-5 py-3 rounded-md font-medium border border-bright-c text-primary-c hover:surface-card">
            <Layers className="w-4.5 h-4.5" /> Recommended adoption order
          </button>
          <button onClick={() => navigate("/prompt")} data-testid="hero-prompt-button" className="flex items-center gap-2 px-5 py-3 rounded-md font-medium border border-bright-c text-primary-c hover:surface-card">
            <Wand2 className="w-4.5 h-4.5" style={{ color: "#F59E0B" }} /> Prompt Playbook
          </button>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border p-4 max-w-3xl" style={{ borderColor: "rgba(245,158,11,0.4)", background: "rgba(245,158,11,0.08)" }} data-testid="evolving-landscape-note">
          <Info className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#F59E0B" }} />
          <p className="text-sm text-secondary-c leading-relaxed">
            <span className="font-semibold text-primary-c">A note on the fast-moving landscape:</span> the six tools featured here reflect today's best-in-class stack. AI tooling evolves extremely fast, so expect some of these to change, merge, or be replaced over time. Treat the structure and principles as the durable part, and revalidate the specific tools before you commit to them.
          </p>
        </div>
      </section>

      <section className="px-5 sm:px-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <h2 className="font-mono text-lg font-bold text-primary-c flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#10B981" }} /> Ecosystem Dependency Map
          </h2>
          {eco && <StageLegend stages={eco.stages} />}
        </div>
        <div className="relative rounded-2xl border border-bright-c overflow-hidden surface-secondary" style={{ height: "560px" }} data-testid="ecosystem-map-container">
          {eco && <EcosystemMap data={eco} onSelect={setSelectedId} selectedId={selectedId} />}
          {selectedTool && <NodeDrawer tool={selectedTool} onClose={() => setSelectedId(null)} />}
        </div>
        <p className="text-xs text-muted-c mt-2 font-mono text-center">
          Click any node to inspect • pan & zoom • data flows left → right through the pipeline
        </p>
      </section>

      <section className="px-5 sm:px-8 max-w-6xl mx-auto py-10">
        <h2 className="font-mono text-lg font-bold text-primary-c mb-4">All six tools</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map((t, i) => (
            <button
              key={t.id}
              data-testid={`tool-card-${t.id}`}
              onClick={() => navigate(`/tools/${t.id}`)}
              className="text-left surface-card border border-c rounded-xl p-4 transition-all hover:border-bright-c group fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border" style={{ color: t.color, borderColor: `${t.color}55` }}>{t.layer_name}</span>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }} />
              </div>
              <div className="font-mono font-bold text-lg text-primary-c flex items-center gap-2">
                {t.name}
                <ArrowRight className="w-4 h-4 text-muted-c opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-sm text-secondary-c mt-1 leading-snug">{t.tagline}</p>
              <div className="mt-3 pt-2.5 border-t border-c font-mono text-xs" style={{ color: t.color }}>-{t.token_waste_reduction} token waste</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
