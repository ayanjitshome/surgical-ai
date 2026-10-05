import { useNavigate } from "react-router-dom";
import { useTools, useGuidance } from "@/hooks/useData";
import { Layers, ArrowRight, Scale, DollarSign, TrendingDown, Trophy } from "lucide-react";

export default function Guidance() {
  const navigate = useNavigate();
  const { data: tools = [] } = useTools();
  const { data: guidance } = useGuidance();
  const byId = Object.fromEntries(tools.map((t) => [t.id, t]));

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10 space-y-12 fade-up">
      {/* Adoption order */}
      <section data-testid="adoption-order-section">
        <div className="font-mono text-xs uppercase tracking-[0.25em] font-semibold mb-3" style={{ color: "#8B5CF6" }}>// opinionated sequence</div>
        <h1 className="font-mono text-3xl font-bold text-primary-c flex items-center gap-2"><Layers className="w-7 h-7" style={{ color: "#8B5CF6" }} /> Recommended adoption order</h1>
        <p className="text-secondary-c mt-2 max-w-2xl">Derived from the tools' dependency layers — Filesystem first, Agent Interface last. Each layer makes the next one cheaper and more accurate.</p>

        <div className="relative mt-7 pl-6">
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5" style={{ background: "var(--line-bright)" }} />
          {tools.map((t, i) => (
            <div key={t.id} className="relative pb-6 last:pb-0 fade-up" style={{ animationDelay: `${i * 70}ms` }} data-testid={`adoption-step-${t.id}`}>
              <div className="absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold text-black z-10" style={{ background: t.color }}>{i + 1}</div>
              <button onClick={() => navigate(`/tools/${t.id}`)} data-testid={`adoption-step-link-${t.id}`} className="w-full text-left surface-card border border-c rounded-xl p-4 ml-2 hover:border-bright-c transition-colors group">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-mono font-bold text-lg text-primary-c flex items-center gap-2">{t.name}
                    <ArrowRight className="w-4 h-4 text-muted-c opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full border" style={{ color: t.color, borderColor: `${t.color}55` }}>{t.layer_name}</span>
                </div>
                <p className="text-sm text-secondary-c mt-1.5 leading-relaxed">{t.adoption_note.replace(/\*\*/g, "")}</p>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Tradeoffs */}
      <section data-testid="tradeoffs-section">
        <h2 className="font-mono text-2xl font-bold text-primary-c flex items-center gap-2"><Scale className="w-6 h-6" style={{ color: "#06B6D4" }} /> Tradeoff comparisons</h2>
        <div className="grid gap-4 mt-5">
          {(guidance?.tradeoffs || []).map((tr, i) => (
            <div key={i} className="surface-card border border-c rounded-xl p-5" data-testid={`tradeoff-${i}`}>
              <h3 className="font-mono text-lg font-semibold text-primary-c">{tr.title}</h3>
              <p className="text-sm text-secondary-c mt-2 leading-relaxed">{tr.guidance}</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                {Object.entries(tr.winner_when).map(([opt, when]) => {
                  const t = byId[opt.toLowerCase().replace(/\s+/g, "-")] || tools.find((x) => x.name === opt);
                  const color = t?.color || "#10B981";
                  return (
                    <div key={opt} className="rounded-lg border border-c p-3" style={{ borderLeft: `3px solid ${color}` }}>
                      <div className="font-mono text-sm font-semibold flex items-center gap-1.5 text-primary-c"><Trophy className="w-3.5 h-3.5" style={{ color }} /> {opt}</div>
                      <div className="text-xs text-secondary-c mt-1">{when}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cost playbook */}
      <section data-testid="cost-playbook-section">
        <h2 className="font-mono text-2xl font-bold text-primary-c flex items-center gap-2"><DollarSign className="w-6 h-6" style={{ color: "#F59E0B" }} /> Cost-optimization playbook</h2>
        <p className="text-secondary-c mt-1.5 text-sm">When each tool earns its keep, and roughly how much token waste it removes.</p>
        <div className="mt-5 overflow-x-auto rounded-xl border border-c">
          <table className="w-full text-sm">
            <thead>
              <tr className="surface-secondary text-left font-mono text-xs uppercase tracking-wider text-muted-c">
                <th className="px-4 py-3">Tool</th><th className="px-4 py-3">Use it when</th><th className="px-4 py-3">Saves</th><th className="px-4 py-3 hidden sm:table-cell">Why</th>
              </tr>
            </thead>
            <tbody>
              {(guidance?.cost_playbook || []).map((row) => {
                const t = byId[row.tool];
                return (
                  <tr key={row.tool} className="border-t border-c" data-testid={`playbook-row-${row.tool}`}>
                    <td className="px-4 py-3 font-mono font-semibold whitespace-nowrap" style={{ color: t?.color }}>{t?.name || row.tool}</td>
                    <td className="px-4 py-3 text-secondary-c">{row.when}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-primary-c flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" style={{ color: t?.color }} />{row.savings}</td>
                    <td className="px-4 py-3 text-muted-c hidden sm:table-cell">{row.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
