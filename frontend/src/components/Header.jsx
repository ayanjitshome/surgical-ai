import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun, Search, Menu, Compass } from "lucide-react";

export const Header = ({ onOpenSearch, onOpenSidebar }) => {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const crumbs = location.pathname.split("/").filter(Boolean);

  return (
    <header className="h-16 shrink-0 surface-secondary border-b border-c flex items-center justify-between px-4 gap-3 sticky top-0 z-30" data-testid="app-header">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onOpenSidebar} className="lg:hidden p-2 rounded-md hover:surface-card text-secondary-c" data-testid="open-sidebar-button">
          <Menu className="w-5 h-5" />
        </button>
        <nav className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-muted-c min-w-0 truncate">
          <Link to="/" className="hover:text-primary-c">~/hub</Link>
          {crumbs.map((c, i) => (
            <span key={i} className="truncate">
              <span className="mx-1">/</span>
              <span className={i === crumbs.length - 1 ? "text-primary-c" : ""}>{c}</span>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSearch}
          data-testid="open-search-button"
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-c surface-card text-secondary-c hover:text-primary-c transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">Search</span>
          <kbd className="hidden sm:inline font-mono text-[10px] px-1.5 py-0.5 rounded border border-c text-muted-c">⌘K</kbd>
        </button>

        <button onClick={toggle} data-testid="theme-toggle-button" className="p-2 rounded-md border border-c surface-card text-secondary-c hover:text-primary-c transition-colors">
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={() => navigate("/decide")}
          data-testid="header-get-started-button"
          className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-md font-semibold text-sm text-black transition-transform hover:scale-[1.03]"
          style={{ background: "#10B981" }}
        >
          <Compass className="w-4 h-4" /> Get Started
        </button>
      </div>
    </header>
  );
};
