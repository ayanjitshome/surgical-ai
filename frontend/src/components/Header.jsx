/* © 2026 Ayanjit Shome. All rights reserved. Concept by Ayanjit Shome. */
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun, Search, Menu, PlaneTakeoff, ChevronRight, Github } from "lucide-react";

const GITHUB_REPO_URL = "https://github.com/ayanjitshome/surgical-ai";

export const Header = ({ onOpenSearch, onOpenSidebar }) => {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const crumbs = location.pathname.split("/").filter(Boolean);

  return (
    <header
      className="h-16 shrink-0 surface-secondary border-b border-c flex items-center justify-between px-4 sm:px-6 gap-3 sticky top-0 z-30"
      data-testid="app-header"
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenSidebar}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-[10px] hover:bg-[var(--bg-card-hover)] text-secondary-c transition-colors"
          data-testid="open-sidebar-button"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1 text-[13px] text-muted-c min-w-0 truncate">
          <Link to="/" className="hover:text-primary-c transition-colors font-medium">Hub</Link>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1 truncate">
              <ChevronRight className="w-3.5 h-3.5 opacity-50" aria-hidden="true" />
              <span className={i === crumbs.length - 1 ? "text-primary-c font-medium capitalize" : "capitalize"}>{c}</span>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSearch}
          data-testid="open-search-button"
          aria-label="Search"
          className="flex items-center gap-2 h-9 px-3 rounded-[10px] border border-c bg-[var(--bg-card)] text-secondary-c hover:text-primary-c hover:bg-[var(--bg-card-hover)] transition-colors"
        >
          <Search className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline text-[13px]">Search</span>
          <kbd className="hidden sm:inline font-mono text-[10px] px-1.5 py-0.5 rounded-md border border-c text-muted-c">⌘K</kbd>
        </button>

        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="header-github-link"
          aria-label="View source on GitHub"
          title="View source on GitHub"
          className="h-9 w-9 flex items-center justify-center rounded-[10px] border border-c bg-[var(--bg-card)] text-secondary-c hover:text-primary-c hover:bg-[var(--bg-card-hover)] transition-colors"
        >
          <Github className="w-4 h-4" aria-hidden="true" />
        </a>

        <button
          onClick={toggle}
          data-testid="theme-toggle-button"
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          className="h-9 w-9 flex items-center justify-center rounded-[10px] border border-c bg-[var(--bg-card)] text-secondary-c hover:text-primary-c hover:bg-[var(--bg-card-hover)] transition-colors"
        >
          {theme === "dark"
            ? <Sun className="w-4 h-4" aria-hidden="true" />
            : <Moon className="w-4 h-4" aria-hidden="true" />}
        </button>

        <button
          onClick={() => navigate("/decide")}
          data-testid="header-get-started-button"
          aria-label="Get started"
          title="Get started"
          className="hig-btn hig-btn-primary h-9 w-9 p-0 flex items-center justify-center"
        >
          <PlaneTakeoff className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};
