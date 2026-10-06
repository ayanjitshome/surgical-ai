import { useParams, useNavigate, Link } from "react-router-dom";
import { useTools, useMeta } from "@/hooks/useData";
import { stageIcon } from "@/lib/icons";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function StageView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: tools = [] } = useTools();
  const { data: meta } = useMeta();
  const stage = (meta?.workflow_stages || []).find((s) => s.id === id);
  const Icon = stageIcon(id);
  const stageTools = tools.filter((t) => t.layer === id);

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10 fade-up" data-testid={`stage-view-${id}`}>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-c hover:text-primary-c mb-5"><ArrowLeft className="w-4 h-4" /> Ecosystem Hub</Link>
      <div className="font-mono text-xs uppercase tracking-[0.25em] font-semibold mb-3" style={{ color: "#8B5CF6" }}>{"// workflow stage "}{stage?.order}</div>
      <h1 className="font-mono text-3xl font-bold text-primary-c flex items-center gap-3"><Icon className="w-8 h-8" style={{ color: "#8B5CF6" }} /> {stage?.name || id}</h1>
      <p className="text-secondary-c mt-2 max-w-2xl">{stage?.description}</p>

      <div className="grid sm:grid-cols-2 gap-3 mt-7">
        {stageTools.length === 0 && <p className="text-muted-c">No tools in this stage.</p>}
        {stageTools.map((t) => (
          <button key={t.id} onClick={() => navigate(`/tools/${t.id}`)} data-testid={`stage-tool-${t.id}`} className="text-left surface-card border border-c rounded-xl p-4 hover:border-bright-c transition-colors group">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-lg text-primary-c">{t.name}</span>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }} />
            </div>
            <p className="text-sm text-secondary-c mt-1 leading-snug">{t.tagline}</p>
            <div className="flex items-center gap-1 mt-3 font-mono text-xs" style={{ color: t.color }}>-{t.token_waste_reduction} token waste <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
          </button>
        ))}
      </div>
    </div>
  );
}
