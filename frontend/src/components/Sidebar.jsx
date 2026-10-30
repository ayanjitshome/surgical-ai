/* © 2026 Ayanjit Shome. All rights reserved. Concept by Ayanjit Shome. */
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTools, useMeta } from "@/hooks/useData";
import { stageIcon } from "@/lib/icons";
import { Boxes, Compass, Network, ChevronRight, Wand2, Sparkles, Coins, Gauge, ChevronDown, Wrench, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

const linkBase =
  "flex items-center gap-3 px-3 py-2 rounded-[10px] text-[0.9375rem] transition-all duration-150";
const linkIdle = "text-secondary-c hover:text-primary-c hover:bg-[var(--bg-card-hover)]";
const linkActive = "text-primary-c bg-[var(--bg-card)] shadow-[var(--shadow-elev-1)]";

/* -------- Collapsible section ------
 * Click-to-expand with a mutually exclusive parent: at most one group is open
 * at a time so the sidebar height stays tight and scrolling stays minimal. */
const AccordionSection = ({ id, label, Icon, color, open, onToggle, children }) => {
  const panelId = `sidebar-section-${id}`;
  return (
    <div className="pt-4" data-testid={`sidebar-section-${id}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        data-testid={`sidebar-toggle-${id}`}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-[10px] text-[11px] uppercase tracking-[0.08em] font-semibold transition-colors",
          open ? "text-primary-c bg-[var(--bg-card-hover)]" : "text-muted-c hover:text-primary-c hover:bg-[var(--bg-card-hover)]"
        )}
      >
        <span className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" style={{ color }} aria-hidden="true" />
          {label}
        </span>
        <ChevronDown
          className={cn("w-3.5 h-3.5 transition-transform", open ? "rotate-0" : "-rotate-90")}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div id={panelId} className="mt-1 space-y-1" role="region" aria-label={label}>
          {children}
        </div>
      )}
    </div>
  );
};

export const Sidebar = ({ onClose }) => {
  const { data: tools = [] } = useTools();
  const { data: meta } = useMeta();
  const location = useLocation();

  const stages = meta?.workflow_stages || [];

  // One group open at a time. Null means both closed.
  const [openGroup, setOpenGroup] = useState(null);
  const toggle = (id) => setOpenGroup((prev) => (prev === id ? null : id));

  // Auto-open the group the current route lives in so the active item is visible.
  useEffect(() => {
    if (location.pathname.startsWith("/tools/")) setOpenGroup("tools");
    else if (location.pathname.startsWith("/stage/")) setOpenGroup("stages");
  }, [location.pathname]);

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

        <AccordionSection
          id="tools"
          label="Tools"
          Icon={Wrench}
          color="#0A84FF"
          open={openGroup === "tools"}
          onToggle={() => toggle("tools")}
        >
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
        </AccordionSection>

        <AccordionSection
          id="stages"
          label="By Workflow Stage"
          Icon={Workflow}
          color="#BF5AF2"
          open={openGroup === "stages"}
          onToggle={() => toggle("stages")}
        >
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
        </AccordionSection>
      </div>
    </nav>
  );
};
