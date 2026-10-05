import { NavLink, useLocation } from "react-router-dom";
import { useTools, useMeta } from "@/hooks/useData";
import { platformIcon, stageIcon } from "@/lib/icons";
import { Boxes, Compass, Network, ChevronRight, Layers, Cpu, Wand2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const SectionLabel = ({ children }) => (
  <div className="px-3 pt-5 pb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-c">
    {children}
  </div>
);

export const Sidebar = ({ onClose }) => {
  const { data: tools = [] } = useTools();
  const { data: meta } = useMeta();
  const location = useLocation();

  const stages = meta?.workflow_stages || [];
  const platforms = meta?.platforms || [];

  const linkBase =
    "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors font-medium";

  return (
    <nav className="h-full flex flex-col surface-secondary border-r border-c" data-testid="sidebar">
      <div className="px-4 h-16 flex items-center gap-2.5 border-b border-c shrink-0">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#10B981" }}>
          <Cpu className="w-5 h-5 text-black" />
        </div>
        <div className="leading-tight">
          <div className="font-mono font-bold text-sm text-primary-c">Surgical AI Hub</div>
          <div className="font-mono text-[10px] text-muted-c tracking-wide">agent-token-ops</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-8">
        <div className="pt-3 space-y-0.5">
          <NavLink to="/" end onClick={onClose} data-testid="nav-link-home"
            className={({ isActive }) => cn(linkBase, isActive ? "surface-card text-primary-c border border-c" : "text-secondary-c hover:text-primary-c")}>
            <Boxes className="w-4 h-4" style={{ color: "#10B981" }} /> Ecosystem Hub
          </NavLink>
          <NavLink to="/decide" onClick={onClose} data-testid="nav-link-decide"
            className={({ isActive }) => cn(linkBase, isActive ? "surface-card text-primary-c border border-c" : "text-secondary-c hover:text-primary-c")}>
            <Compass className="w-4 h-4" style={{ color: "#06B6D4" }} /> Decision Guide
          </NavLink>
          <NavLink to="/guidance" onClick={onClose} data-testid="nav-link-guidance"
            className={({ isActive }) => cn(linkBase, isActive ? "surface-card text-primary-c border border-c" : "text-secondary-c hover:text-primary-c")}>
            <Network className="w-4 h-4" style={{ color: "#8B5CF6" }} /> Adoption & Tradeoffs
          </NavLink>
          <NavLink to="/prompt" end onClick={onClose} data-testid="nav-link-prompt"
            className={({ isActive }) => cn(linkBase, isActive ? "surface-card text-primary-c border border-c" : "text-secondary-c hover:text-primary-c")}>
            <Wand2 className="w-4 h-4" style={{ color: "#F59E0B" }} /> Prompt Playbook
          </NavLink>
          <NavLink to="/prompt/builder" onClick={onClose} data-testid="nav-link-prompt-builder"
            className={({ isActive }) => cn(linkBase, isActive ? "surface-card text-primary-c border border-c" : "text-secondary-c hover:text-primary-c")}>
            <Sparkles className="w-4 h-4" style={{ color: "#F59E0B" }} /> Prompt Builder
          </NavLink>
        </div>

        <SectionLabel>Tools</SectionLabel>
        <div className="space-y-0.5">
          {tools.map((t) => {
            const active = location.pathname === `/tools/${t.id}` || location.pathname === `/tools/${t.id}/setup`;
            return (
              <NavLink key={t.id} to={`/tools/${t.id}`} onClick={onClose} data-testid={`nav-link-knowledge-${t.id}`}
                className={cn(linkBase, "justify-between", active ? "surface-card text-primary-c border border-c" : "text-secondary-c hover:text-primary-c")}>
                <span className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }} />
                  {t.name}
                </span>
                <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", active && "translate-x-0.5")} />
              </NavLink>
            );
          })}
        </div>

        <SectionLabel>By Workflow Stage</SectionLabel>
        <div className="space-y-0.5">
          {stages.map((s) => {
            const Icon = stageIcon(s.id);
            return (
              <NavLink key={s.id} to={`/stage/${s.id}`} onClick={onClose} data-testid={`nav-link-stage-${s.id}`}
                className={({ isActive }) => cn(linkBase, isActive ? "surface-card text-primary-c border border-c" : "text-secondary-c hover:text-primary-c")}>
                <Icon className="w-4 h-4 text-muted-c" /> {s.name}
              </NavLink>
            );
          })}
        </div>

        <SectionLabel>By Platform</SectionLabel>
        <div className="grid grid-cols-2 gap-1 px-1">
          {platforms.map((p) => {
            const Icon = platformIcon(p.id);
            return (
              <NavLink key={p.id} to={`/platform/${p.id}`} onClick={onClose} data-testid={`nav-link-platform-${p.id}`}
                className={({ isActive }) => cn("flex items-center gap-1.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors", isActive ? "surface-card text-primary-c border border-c" : "text-secondary-c hover:text-primary-c")}>
                <Icon className="w-3.5 h-3.5 text-muted-c" /> {p.name}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
