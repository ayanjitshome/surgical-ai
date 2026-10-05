import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { getTool, refreshTool } from "@/lib/api";
import { platformIcon } from "@/lib/icons";
import { Settings2, Github, RefreshCw, TrendingDown, Zap, Clock, ArrowLeft, Layers, BookText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "what", label: "What & Why", icon: BookText },
  { id: "mechanics", label: "Token Mechanics", icon: TrendingDown },
  { id: "adoption", label: "Adoption Order", icon: Layers },
  { id: "platform", label: "Platform Notes", icon: Settings2 },
  { id: "readme", label: "GitHub README", icon: Github },
];

export default function ToolDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState("what");
  const [activePlatform, setActivePlatform] = useState("mac");

  const { data: tool, isLoading } = useQuery({ queryKey: ["tool", id], queryFn: () => getTool(id) });

  const refresh = useMutation({
    mutationFn: () => refreshTool(id),
    onSuccess: (d) => {
      toast.success(d.fetched ? `Fetched README (${d.length} chars)` : "No README returned from GitHub");
      qc.invalidateQueries({ queryKey: ["tool", id] });
    },
    onError: () => toast.error("GitHub refresh failed"),
  });

  if (isLoading || !tool) {
    return <div className="p-8 font-mono text-muted-c" data-testid="tool-loading">Loading tool…</div>;
  }

  const platformNotes = tool.platform_notes || {};
  const platformIds = Object.keys(platformNotes);
  const PlatIcon = platformIcon(activePlatform);

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 fade-up" data-testid={`tool-detail-${tool.id}`}>
      <Link to="/" data-testid="tool-back-link" className="inline-flex items-center gap-1.5 text-sm text-muted-c hover:text-primary-c mb-5">
        <ArrowLeft className="w-4 h-4" /> Ecosystem Hub
      </Link>

      {/* Hero */}
      <div className="rounded-2xl border border-bright-c surface-secondary p-6 relative overflow-hidden" style={{ boxShadow: `0 0 40px ${tool.color}22` }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: tool.color }} />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border" style={{ color: tool.color, borderColor: `${tool.color}66` }}>{tool.layer_name}</span>
            <h1 className="font-mono text-3xl sm:text-4xl font-bold text-primary-c mt-3">{tool.name}</h1>
            <p className="text-base text-secondary-c mt-1.5 max-w-xl">{tool.tagline}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => navigate(`/tools/${tool.id}/setup`)} data-testid="tool-setup-button" className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-semibold text-black" style={{ background: tool.color }}>
              <Settings2 className="w-4 h-4" /> Set Up
            </button>
            <a href={tool.github_repo} target="_blank" rel="noreferrer" data-testid="tool-github-link" className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-md border border-bright-c text-sm text-primary-c hover:surface-card">
              <Github className="w-4 h-4" /> Repo
            </a>
          </div>
        </div>
        <div className="relative grid grid-cols-3 gap-3 mt-6">
          {[
            { label: "Token Waste Saved", value: `-${tool.stats.token_saved}`, icon: TrendingDown },
            { label: "Latency", value: tool.stats.latency, icon: Zap },
            { label: "Setup Time", value: tool.stats.setup_time, icon: Clock },
          ].map((s) => (
            <div key={s.label} className="surface-card border border-c rounded-lg p-3">
              <s.icon className="w-4 h-4 mb-1.5" style={{ color: tool.color }} />
              <div className="font-mono text-lg font-bold text-primary-c">{s.value}</div>
              <div className="text-[11px] text-muted-c">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-6 border-b border-c overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            data-testid={`tool-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
              tab === t.id ? "text-primary-c" : "text-muted-c hover:text-secondary-c border-transparent"
            )}
            style={tab === t.id ? { borderColor: tool.color } : {}}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="py-6">
        {tab === "what" && <div className="md-content" data-testid="tab-content-what"><ReactMarkdown>{tool.overview}</ReactMarkdown></div>}
        {tab === "mechanics" && <div className="md-content" data-testid="tab-content-mechanics"><ReactMarkdown>{tool.mechanics}</ReactMarkdown></div>}
        {tab === "adoption" && (
          <div data-testid="tab-content-adoption">
            <div className="surface-card border-l-4 rounded-r-lg p-4" style={{ borderColor: tool.color }}>
              <div className="font-mono text-xs uppercase tracking-wider text-muted-c mb-2">Opinionated placement</div>
              <div className="md-content"><ReactMarkdown>{tool.adoption_note}</ReactMarkdown></div>
            </div>
            <Link to="/guidance" className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium" style={{ color: tool.color }}>
              See the full recommended adoption order <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        )}
        {tab === "platform" && (
          <div data-testid="tab-content-platform">
            <div className="flex flex-wrap gap-2 mb-4">
              {platformIds.map((pid) => {
                const Icon = platformIcon(pid);
                return (
                  <button key={pid} data-testid={`platform-pill-${pid}`} onClick={() => setActivePlatform(pid)}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                      activePlatform === pid ? "text-primary-c border-bright-c surface-card" : "text-muted-c border-c hover:text-secondary-c")}
                    style={activePlatform === pid ? { borderColor: tool.color } : {}}>
                    <Icon className="w-4 h-4" /> {pid}
                  </button>
                );
              })}
            </div>
            <div className="surface-card border border-c rounded-lg p-5 flex gap-4" data-testid="platform-note-content">
              <PlatIcon className="w-6 h-6 shrink-0 mt-0.5" style={{ color: tool.color }} />
              <p className="text-secondary-c leading-relaxed">{platformNotes[activePlatform]}</p>
            </div>
          </div>
        )}
        {tab === "readme" && (
          <div data-testid="tab-content-readme">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div className="text-sm text-muted-c font-mono">
                {tool.github_fetched_at ? `Cached ${new Date(tool.github_fetched_at).toLocaleString()}` : "Not yet fetched from GitHub"}
              </div>
              <button onClick={() => refresh.mutate()} disabled={refresh.isPending} data-testid="refresh-github-button"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-bright-c text-sm text-primary-c hover:surface-card disabled:opacity-50">
                <RefreshCw className={cn("w-4 h-4", refresh.isPending && "animate-spin")} /> {refresh.isPending ? "Fetching…" : "Refresh from GitHub"}
              </button>
            </div>
            {tool.github_cache ? (
              <div className="md-content surface-card border border-c rounded-lg p-5"><ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>{tool.github_cache}</ReactMarkdown></div>
            ) : (
              <div className="surface-card border border-dashed border-bright-c rounded-lg p-8 text-center">
                <Github className="w-8 h-8 mx-auto text-muted-c mb-3" />
                <p className="text-secondary-c">No cached README yet. Pull the latest from <a href={tool.github_repo} target="_blank" rel="noreferrer" style={{ color: tool.color }}>{tool.github_repo.replace("https://github.com/", "")}</a>.</p>
                <button onClick={() => refresh.mutate()} disabled={refresh.isPending} data-testid="refresh-github-empty-button" className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-md font-semibold text-black" style={{ background: tool.color }}>
                  <RefreshCw className={cn("w-4 h-4", refresh.isPending && "animate-spin")} /> Fetch now
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
