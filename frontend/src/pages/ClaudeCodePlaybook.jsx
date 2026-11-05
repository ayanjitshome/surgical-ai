/* © 2026 Ayanjit Shome. All rights reserved. Concept by Ayanjit Shome. */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Printer,
  Clock,
  ListOrdered,
} from "lucide-react";
import { CHAPTERS } from "@/lib/claudeCodePlaybookData";

const OPENED_KEY = "ccp-opened-v1";

const usePersistentOpened = () => {
  const [opened, setOpened] = useState({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(OPENED_KEY);
      if (raw) setOpened(JSON.parse(raw));
    } catch {
      /* no-op */
    }
  }, []);
  const mark = (slug) =>
    setOpened((prev) => {
      if (prev[slug]) return prev;
      const next = { ...prev, [slug]: true };
      try {
        localStorage.setItem(OPENED_KEY, JSON.stringify(next));
      } catch {
        /* no-op */
      }
      return next;
    });
  return [opened, mark];
};

/* ---------------- Landing grid ---------------- */
const Landing = () => {
  const [opened] = usePersistentOpened();
  return (
    <div
      className="max-w-6xl mx-auto px-5 sm:px-8 py-10 space-y-10 fade-up"
      data-testid="claude-code-playbook-landing"
    >
      {/* Intro */}
      <section>
        <div
          className="text-xs uppercase tracking-[0.25em] font-semibold mb-3 flex items-center gap-2"
          style={{ color: "var(--brand)" }}
        >
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          {"// claude code playbook"}
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-c max-w-3xl tracking-[-0.02em]">
          Stop prompting blind. Set Claude Code{" "}
          <span style={{ color: "var(--brand)" }}>up once</span>.
        </h1>
        <p className="text-secondary-c mt-4 max-w-2xl leading-relaxed">
          Eight short chapters that turn a terminal install into a
          configured workbench. For engineers already using Claude Code
          in anger.
        </p>

        {/* Headline numbers */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5 text-secondary-c">
            <ListOrdered className="w-4 h-4 text-muted-c" /> 8 chapters
          </span>
          <span className="flex items-center gap-1.5 text-secondary-c">
            <Clock className="w-4 h-4 text-muted-c" /> about 25 min
            read
          </span>
          <span className="flex items-center gap-1.5 text-secondary-c">
            <CheckCircle2 className="w-4 h-4 text-muted-c" /> afternoon
            to apply
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            data-testid="playbook-print-btn"
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted-c hover:text-primary-c transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </section>

      {/* Grid */}
      <section>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHAPTERS.map((c, i) => (
            <Link
              key={c.slug}
              to={`/claude-code-playbook/${c.slug}`}
              data-testid={`chapter-card-${c.slug}`}
              className="group relative surface-card border border-c rounded-[10px] p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elev-2)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] fade-up"
              style={{
                borderLeft: `3px solid ${c.accent}`,
                animationDelay: `${i * 40}ms`,
              }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-10 h-10 rounded-[8px] flex items-center justify-center"
                  style={{
                    background: `${c.accent}22`,
                    color: c.accent,
                  }}
                >
                  <c.Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="flex items-center gap-2">
                  {opened[c.slug] && (
                    <span
                      className="flex items-center gap-1 text-[11px] text-muted-c"
                      data-testid={`chapter-opened-${c.slug}`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--brand)]" />
                      Opened
                    </span>
                  )}
                  <span className="font-mono text-xs text-muted-c">
                    0{c.number}
                  </span>
                </div>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-primary-c leading-tight group-hover:text-[var(--brand)] transition-colors">
                {c.title}
              </h3>
              <p className="mt-1.5 text-sm text-secondary-c italic">
                {c.promise}
              </p>
              <p className="mt-3 text-sm text-secondary-c leading-relaxed line-clamp-3">
                {c.takeaway}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

/* ---------------- Chapter reader ---------------- */
const Reader = ({ slug }) => {
  const navigate = useNavigate();
  const [, markOpened] = usePersistentOpened();
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef(null);

  const index = CHAPTERS.findIndex((c) => c.slug === slug);
  const chapter = CHAPTERS[index];
  const prev = index > 0 ? CHAPTERS[index - 1] : null;
  const next = index < CHAPTERS.length - 1 ? CHAPTERS[index + 1] : null;

  // Mark this chapter as opened, and scroll the main viewport to the top.
  useEffect(() => {
    if (!chapter) return;
    markOpened(chapter.slug);
    const main = document.getElementById("main-content");
    if (main) main.scrollTo({ top: 0, behavior: "instant" });
    // If URL carried a hash, let the browser jump to it once the body
    // is mounted (anchor headings set scroll-mt-24).
    if (window.location.hash) {
      const id = decodeURIComponent(window.location.hash.slice(1));
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Reading progress bar reflects the scroll position of #main-content.
  useEffect(() => {
    const main = document.getElementById("main-content");
    if (!main) return;
    const onScroll = () => {
      const max = main.scrollHeight - main.clientHeight;
      if (max <= 0) {
        setProgress(0);
        return;
      }
      setProgress(Math.max(0, Math.min(1, main.scrollTop / max)));
    };
    main.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => main.removeEventListener("scroll", onScroll);
  }, [slug]);

  if (!chapter) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-16 text-center">
        <p className="text-secondary-c">That chapter does not exist.</p>
        <Link
          to="/claude-code-playbook"
          className="inline-block mt-4 text-[var(--brand)] underline"
        >
          Back to the playbook
        </Link>
      </div>
    );
  }

  const Body = chapter.Body;

  return (
    <div
      ref={scrollRef}
      className="relative"
      data-testid={`chapter-reader-${chapter.slug}`}
    >
      {/* Progress bar pinned to the top of the viewport */}
      <div
        className="sticky top-0 z-30 h-0.5 bg-[var(--bg-card-hover)] print:hidden"
        aria-hidden="true"
      >
        <div
          className="h-full transition-[width] duration-150"
          style={{
            width: `${progress * 100}%`,
            background: chapter.accent,
          }}
        />
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 space-y-8 pb-32 lg:pb-16 fade-up">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/claude-code-playbook")}
            data-testid="chapter-back-btn"
            className="inline-flex items-center gap-1.5 text-sm text-muted-c hover:text-primary-c transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All chapters
          </button>
          <div className="flex items-center gap-2 text-xs text-muted-c font-mono">
            <chapter.Icon
              className="w-4 h-4"
              style={{ color: chapter.accent }}
              aria-hidden="true"
            />
            Chapter 0{chapter.number} of 08
          </div>
        </div>

        {/* Title */}
        <header>
          <div
            className="text-xs uppercase tracking-[0.25em] font-semibold mb-2"
            style={{ color: chapter.accent }}
          >
            {`// chapter ${chapter.number}`}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-primary-c tracking-[-0.02em]">
            {chapter.title}
          </h1>
          <p className="mt-3 text-secondary-c italic">{chapter.promise}</p>
        </header>

        {/* Body */}
        <article className="space-y-6">
          <Body accent={chapter.accent} />
        </article>

        {/* Prev / next (desktop) */}
        <nav
          className="hidden lg:grid grid-cols-2 gap-3 pt-6 border-t border-c"
          aria-label="Chapter navigation"
        >
          {prev ? (
            <Link
              to={`/claude-code-playbook/${prev.slug}`}
              data-testid="chapter-prev-link"
              className="group surface-card border border-c rounded-[10px] p-4 hover:-translate-y-0.5 transition-all"
              style={{ borderLeft: `3px solid ${prev.accent}` }}
            >
              <div className="text-xs text-muted-c flex items-center gap-1">
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </div>
              <div className="mt-1 font-semibold text-primary-c group-hover:text-[var(--brand)]">
                {prev.title}
              </div>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to={`/claude-code-playbook/${next.slug}`}
              data-testid="chapter-next-link"
              className="group surface-card border border-c rounded-[10px] p-4 text-right hover:-translate-y-0.5 transition-all"
              style={{ borderRight: `3px solid ${next.accent}` }}
            >
              <div className="text-xs text-muted-c flex items-center gap-1 justify-end">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </div>
              <div className="mt-1 font-semibold text-primary-c group-hover:text-[var(--brand)]">
                {next.title}
              </div>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>

      {/* Sticky prev/next (mobile only) */}
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-20 border-t border-c bg-[var(--bg-card)]/95 backdrop-blur-sm print:hidden"
        role="navigation"
        aria-label="Chapter navigation"
      >
        <div className="flex items-stretch">
          <button
            type="button"
            disabled={!prev}
            onClick={() =>
              prev && navigate(`/claude-code-playbook/${prev.slug}`)
            }
            data-testid="chapter-prev-mobile"
            className="flex-1 flex items-center gap-1.5 justify-center py-3 text-sm text-primary-c disabled:text-muted-c disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <div className="w-px bg-[var(--border)]" />
          <button
            type="button"
            disabled={!next}
            onClick={() =>
              next && navigate(`/claude-code-playbook/${next.slug}`)
            }
            data-testid="chapter-next-mobile"
            className="flex-1 flex items-center gap-1.5 justify-center py-3 text-sm text-primary-c disabled:text-muted-c disabled:opacity-50"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Print-only: dump every chapter in order after this one for a
       * complete document. Browser renders this in a separate flow. */}
      <div className="hidden print:block max-w-3xl mx-auto px-6 py-6">
        {CHAPTERS.filter((c) => c.slug !== chapter.slug).map((c) => (
          <section key={c.slug} className="mt-10">
            <h2 className="text-2xl font-bold">{c.title}</h2>
            <c.Body accent={c.accent} />
          </section>
        ))}
      </div>
    </div>
  );
};

/* ---------------- Entry component ---------------- */
export default function ClaudeCodePlaybook() {
  const { slug } = useParams();
  return slug ? <Reader slug={slug} /> : <Landing />;
}
