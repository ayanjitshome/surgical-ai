/* © 2026 Ayanjit Shome. All rights reserved. Concept by Ayanjit Shome. */
import { NavLink, useLocation } from "react-router-dom";
import { useTools, useMeta } from "@/hooks/useData";
import { stageIcon } from "@/lib/icons";
import { Boxes, Compass, Network, ChevronRight, Wand2, Sparkles, Coins, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

const SectionLabel = ({ children }) => (
  <div className="px-3 pt-6 pb-2 text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-c">
    {children}
  </div>
);

const linkBase =
  "flex items-center gap-3 px-3 py-2 rounded-[10px] text-[0.9375rem] transition-all duration-150";
const linkIdle = "text-secondary-c hover:text-primary-c hover:bg-[var(--bg-card-hover)]";
const linkActive = "text-primary-c bg-[var(--bg-card)] shadow-[var(--shadow-elev-1)]";

export const Sidebar = ({ onClose }) => {
  const { data: tools = [] } = useTools();
  const { data: meta } = useMeta();
  const location = useLocation();

  const stages = meta?.workflow_stages || [];

  return (
    <nav
      className="h-full flex flex-col surface-secondary border-r border-c"
      aria-label="Primary navigation"
      data-testid="sidebar"
    >
      <div className="px-4 h-16 flex items-center gap-3 border-b border-c shrink-0">
        <img src={logo} alt="Surgical AI Hub" className="w-8 h-8 object-contain shrink-0" data-testid="app-logo" />
        <div className="leading-tight">
          <div className="font-semibold text-[15px] text-primary-c tracking-[-0.01em]">Surgical AI Hub</div>
          <div className="text-[11px] text-muted-c">Optimising token usage</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-8">
        <div className="pt-3 space-y-1">
          <NavLink to="/" end onClick={onClose} data-testid="nav-link-home"
            className={({ isActive }) => cn(linkBase, isActive ? linkActive : linkIdle)}>
            <Boxes className="w-[18px] h-[18px]" style={{ color: "#0A84FF" }} aria-hidden="true" />
            <span>Ecosystem Hub</span>
          </NavLink>
          <NavLink to="/decide" onClick={onClose} data-testid="nav-link-decide"
            className={({ isActive }) => cn(linkBase, isActive ? linkActive : linkIdle)}>
            <Compass className="w-[18px] h-[18px]" style={{ color: "#30D158" }} aria-hidden="true" />
            <span>Decision Guide</span>
          </NavLink>
          <NavLink to="/guidance" onClick={onClose} data-testid="nav-link-guidance"
            className={({ isActive }) => cn(linkBase, isActive ? linkActive : linkIdle)}>
            <Network className="w-[18px] h-[18px]" style={{ color: "#BF5AF2" }} aria-hidden="true" />
            <span>Adoption & Tradeoffs</span>
          </NavLink>
          <NavLink to="/prompt" end onClick={onClose} data-testid="nav-link-prompt"
            className={({ isActive }) => cn(linkBase, isActive ? linkActive : linkIdle)}>
            <Wand2 className="w-[18px] h-[18px]" style={{ color: "#FF9F0A" }} aria-hidden="true" />
            <span>Prompt Playbook</span>
          </NavLink>
          <NavLink to="/prompt/builder" onClick={onClose} data-testid="nav-link-prompt-builder"
            className={({ isActive }) => cn(linkBase, isActive ? linkActive : linkIdle)}>
            <Sparkles className="w-[18px] h-[18px]" style={{ color: "#FFD60A" }} aria-hidden="true" />
            <span>Prompt Builder</span>
          </NavLink>
          <NavLink to="/tokeneconomy" onClick={onClose} data-testid="nav-link-token-economy"
            className={({ isActive }) => cn(linkBase, isActive ? linkActive : linkIdle)}>
            <Coins className="w-[18px] h-[18px]" style={{ color: "#30D158" }} aria-hidden="true" />
            <span>Token Economy</span>
          </NavLink>
          <NavLink to="/risk-reward" onClick={onClose} data-testid="nav-link-risk-reward"
            className={({ isActive }) => cn(linkBase, isActive ? linkActive : linkIdle)}>
            <Gauge className="w-[18px] h-[18px]" style={{ color: "#FF453A" }} aria-hidden="true" />
            <span>Risk & Reward</span>
          </NavLink>
        </div>

        <SectionLabel>Tools</SectionLabel>
        <div className="space-y-1">
          {tools.map((t) => {
            const active = location.pathname === `/tools/${t.id}` || location.pathname === `/tools/${t.id}/setup`;
            return (
              <NavLink key={t.id} to={`/tools/${t.id}`} onClick={onClose} data-testid={`nav-link-knowledge-${t.id}`}
                className={cn(linkBase, "justify-between", active ? linkActive : linkIdle)}>
                <span className="flex items-center gap-3">
                  <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: t.color, boxShadow: `0 0 10px ${t.color}80` }} />
                  <span>{t.name}</span>
                </span>
                <ChevronRight className={cn("w-3.5 h-3.5 transition-transform text-muted-c", active && "translate-x-0.5 text-primary-c")} aria-hidden="true" />
              </NavLink>
            );
          })}
        </div>

        <SectionLabel>By Workflow Stage</SectionLabel>
        <div className="space-y-1">
          {stages.map((s) => {
            const Icon = stageIcon(s.id);
            return (
              <NavLink key={s.id} to={`/stage/${s.id}`} onClick={onClose} data-testid={`nav-link-stage-${s.id}`}
                className={({ isActive }) => cn(linkBase, isActive ? linkActive : linkIdle)}>
                <Icon className="w-[18px] h-[18px] text-muted-c" aria-hidden="true" />
                <span>{s.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
