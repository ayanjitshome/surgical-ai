import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { SearchModal } from "@/components/SearchModal";

export const Layout = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="h-screen flex overflow-hidden surface-primary">
      <a href="#main-content" className="skip-link" data-testid="skip-to-content">Skip to content</a>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0" aria-label="Primary">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          <div className="absolute left-0 top-0 bottom-0 w-64" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenSearch={() => setSearchOpen(true)} onOpenSidebar={() => setSidebarOpen(true)} />
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto grid-bg">
          <Outlet />
        </main>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};
