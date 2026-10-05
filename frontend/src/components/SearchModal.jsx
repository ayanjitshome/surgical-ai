import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTools } from "@/hooks/useData";
import { Search, CornerDownLeft, FileText, Settings2, X } from "lucide-react";

const buildIndex = (tools) => {
  const entries = [];
  tools.forEach((t) => {
    entries.push({
      type: "tool", toolId: t.id, color: t.color,
      title: t.name, subtitle: t.tagline,
      path: `/tools/${t.id}`,
      haystack: `${t.name} ${t.tagline} ${t.overview} ${t.mechanics} ${t.layer_name}`.toLowerCase(),
    });
    entries.push({
      type: "setup", toolId: t.id, color: t.color,
      title: `${t.name} — Setup Wizard`, subtitle: "Guided install & validation",
      path: `/tools/${t.id}/setup`,
      haystack: `${t.name} setup install wizard ${(t.setup_steps || []).map((s) => s.title).join(" ")}`.toLowerCase(),
    });
    Object.entries(t.platform_notes || {}).forEach(([pid, note]) => {
      entries.push({
        type: "platform", toolId: t.id, color: t.color,
        title: `${t.name} on ${pid}`, subtitle: note.slice(0, 80) + "…",
        path: `/tools/${t.id}`,
        haystack: `${t.name} ${pid} ${note}`.toLowerCase(),
      });
    });
  });
  return entries;
};

export const SearchModal = ({ open, onClose }) => {
  const { data: tools = [] } = useTools();
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const index = useMemo(() => buildIndex(tools), [tools]);

  const results = useMemo(() => {
    if (!q.trim()) return index.filter((e) => e.type === "tool");
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return index
      .filter((e) => terms.every((term) => e.haystack.includes(term)))
      .slice(0, 12);
  }, [q, index]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const go = (path) => {
    navigate(path);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4" data-testid="search-modal">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl surface-secondary border border-bright-c rounded-xl shadow-2xl overflow-hidden fade-up">
        <div className="flex items-center gap-3 px-4 border-b border-c">
          <Search className="w-5 h-5 text-muted-c" />
          <input
            autoFocus
            data-testid="search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tools, platforms, setup steps…"
            className="flex-1 bg-transparent py-4 outline-none text-primary-c placeholder:text-muted-c"
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) go(results[0].path);
              if (e.key === "Escape") onClose();
            }}
          />
          <button onClick={onClose} data-testid="search-close-button" className="p-1 text-muted-c hover:text-primary-c"><X className="w-4 h-4" /></button>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <div className="px-3 py-8 text-center text-muted-c text-sm">No matches for "{q}"</div>
          )}
          {results.map((r, i) => (
            <button
              key={i}
              data-testid={`search-result-${r.toolId}-${r.type}`}
              onClick={() => go(r.path)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:surface-card transition-colors group"
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
              <span className="shrink-0 text-muted-c">
                {r.type === "setup" ? <Settings2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-primary-c truncate">{r.title}</span>
                <span className="block text-xs text-muted-c truncate">{r.subtitle}</span>
              </span>
              <CornerDownLeft className="w-3.5 h-3.5 text-muted-c opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
