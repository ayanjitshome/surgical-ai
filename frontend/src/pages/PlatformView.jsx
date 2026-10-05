import { useParams, useNavigate, Link } from "react-router-dom";
import { useTools, useMeta } from "@/hooks/useData";
import { platformIcon } from "@/lib/icons";
import { ArrowLeft, ArrowRight, Settings2 } from "lucide-react";

export default function PlatformView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: tools = [] } = useTools();
  const { data: meta } = useMeta();
  const platform = (meta?.platforms || []).find((p) => p.id === id);
  const Icon = platformIcon(id);

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10 fade-up" data-testid={`platform-view-${id}`}>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-c hover:text-primary-c mb-5"><ArrowLeft className="w-4 h-4" /> Ecosystem Hub</Link>
      <div className="font-mono text-xs uppercase tracking-[0.25em] font-semibold mb-3" style={{ color: "#10B981" }}>// platform guide</div>
      <h1 className="font-mono text-3xl font-bold text-primary-c flex items-center gap-3"><Icon className="w-8 h-8" style={{ color: "#10B981" }} /> {platform?.name || id}</h1>
      <p className="text-secondary-c mt-2">Platform-specific notes for every tool on {platform?.name || id}.</p>

      <div className="space-y-3 mt-7">
        {tools.map((t) => (
          <div key={t.id} className="surface-card border border-c rounded-xl p-4" data-testid={`platform-tool-${t.id}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button onClick={() => navigate(`/tools/${t.id}`)} data-testid={`platform-tool-link-${t.id}`} className="font-mono font-bold text-lg text-primary-c flex items-center gap-2 hover:underline" style={{ textDecorationColor: t.color }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }} /> {t.name}
              </button>
              <button onClick={() => navigate(`/tools/${t.id}/setup`)} data-testid={`platform-setup-${t.id}`} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-c text-primary-c hover:border-bright-c"><Settings2 className="w-3.5 h-3.5" /> Setup</button>
            </div>
            <p className="text-sm text-secondary-c mt-2 leading-relaxed">{(t.platform_notes || {})[id]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
