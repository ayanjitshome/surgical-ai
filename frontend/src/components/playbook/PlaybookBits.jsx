/* © 2026 Ayanjit Shome. All rights reserved. Concept by Ayanjit Shome. */
import { useEffect, useMemo, useState } from "react";
import { Link as LinkIcon, Search } from "lucide-react";
import { toast } from "sonner";

/* Shared heading with hover-to-reveal anchor link. Click copies a deep
 * link to that heading. Slugs are generated once and passed from the
 * chapter body so Vale sees plain text. */
const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const AnchorHeading = ({ level = 2, children, id, accent }) => {
  const Tag = `h${level}`;
  const anchor = id || slugify(typeof children === "string" ? children : "");
  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#${anchor}`;
    try {
      navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      /* no-op */
    }
  };
  const sizes = {
    2: "text-2xl sm:text-3xl font-bold",
    3: "text-xl sm:text-2xl font-semibold",
    4: "text-base sm:text-lg font-semibold",
  };
  return (
    <Tag
      id={anchor}
      className={`group relative scroll-mt-24 text-primary-c flex items-center gap-2 ${sizes[level]}`}
      data-testid={`heading-${anchor}`}
    >
      {level === 2 && accent && (
        <span
          className="inline-block w-1 h-6 rounded-sm shrink-0"
          style={{ background: accent }}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy link to this section"
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded p-1 text-muted-c hover:text-primary-c"
      >
        <LinkIcon className="w-3.5 h-3.5" />
      </button>
    </Tag>
  );
};

export const H2 = ({ children, accent, id }) => (
  <AnchorHeading level={2} accent={accent} id={id}>
    {children}
  </AnchorHeading>
);
export const H3 = ({ children, id }) => (
  <AnchorHeading level={3} id={id}>
    {children}
  </AnchorHeading>
);
export const H4 = ({ children, id }) => (
  <AnchorHeading level={4} id={id}>
    {children}
  </AnchorHeading>
);

export const P = ({ children }) => (
  <p className="text-[0.95rem] leading-relaxed text-secondary-c">{children}</p>
);

export const Lead = ({ children }) => (
  <p className="text-[1.0625rem] leading-relaxed text-primary-c/90">{children}</p>
);

export const UL = ({ children, ordered = false }) => {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag
      className={`pl-5 space-y-1.5 text-[0.95rem] leading-relaxed text-secondary-c ${
        ordered ? "list-decimal" : "list-disc"
      }`}
    >
      {children}
    </Tag>
  );
};

export const LI = ({ children }) => <li>{children}</li>;

export const Mono = ({ children }) => (
  <code className="font-mono text-[0.85em] px-1 py-0.5 rounded bg-[var(--bg-card-hover)] text-primary-c">
    {children}
  </code>
);

export const Note = ({ children, tone = "info" }) => {
  const tones = {
    info: { border: "rgba(10,132,255,0.35)", bg: "rgba(10,132,255,0.08)" },
    warn: { border: "rgba(255,159,10,0.4)", bg: "rgba(255,159,10,0.08)" },
  };
  const t = tones[tone] || tones.info;
  return (
    <div
      className="rounded-lg p-3.5 text-sm text-secondary-c"
      style={{ border: `1px solid ${t.border}`, background: t.bg }}
    >
      {children}
    </div>
  );
};

/* ---------- Filterable table ----------
 * Pass columns as [{ key, label, filter?: "select" | "text" | false }].
 * rows are plain objects keyed by column `key`. Searches across every
 * cell's text content. Each filter column adds a small select above the
 * table. Below six rows the filter UI is hidden to stay out of the way. */
export const FilterTable = ({ columns, rows, testId, minRowsForFilter = 6 }) => {
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({});
  const showFilters = rows.length >= minRowsForFilter;

  const filterable = columns.filter((c) => c.filter);
  const options = useMemo(() => {
    const m = {};
    filterable.forEach((c) => {
      const vals = Array.from(new Set(rows.map((r) => String(r[c.key] ?? "")).filter(Boolean)));
      m[c.key] = vals.sort();
    });
    return m;
  }, [rows, filterable]);

  const filtered = rows.filter((r) => {
    if (q) {
      const hay = Object.values(r).join(" ").toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    for (const [k, v] of Object.entries(filters)) {
      if (v && String(r[k] ?? "") !== v) return false;
    }
    return true;
  });

  return (
    <div className="my-4" data-testid={testId}>
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-c" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter rows"
              data-testid={`${testId}-search`}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-c bg-[var(--bg-card)] text-primary-c placeholder:text-muted-c focus:outline-none focus:border-[var(--brand)]"
            />
          </div>
          {filterable.map((c) => (
            <select
              key={c.key}
              value={filters[c.key] || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, [c.key]: e.target.value }))
              }
              data-testid={`${testId}-filter-${c.key}`}
              className="px-2.5 py-1.5 text-sm rounded-md border border-c bg-[var(--bg-card)] text-primary-c focus:outline-none focus:border-[var(--brand)]"
            >
              <option value="">{c.label}: any</option>
              {options[c.key].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-c">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--bg-card-hover)]">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="text-left px-3.5 py-2.5 font-semibold text-primary-c border-b border-c"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr
                key={i}
                className="border-b border-c last:border-b-0 hover:bg-[var(--bg-card-hover)]/60"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className="px-3.5 py-2.5 align-top text-secondary-c"
                  >
                    {r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3.5 py-6 text-center text-muted-c text-sm"
                >
                  No rows match that filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------- Interactive checklist ---------- */
const CHECKLIST_KEY = "ccp-checklist-v1";

export const Checklist = ({ items }) => {
  const [state, setState] = useState({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      /* no-op */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(state));
    } catch {
      /* no-op */
    }
  }, [state]);

  const toggle = (id) => setState((p) => ({ ...p, [id]: !p[id] }));
  const reset = () => setState({});
  const done = items.filter((i) => state[i.id]).length;

  return (
    <div className="my-4 rounded-xl border border-c p-4 bg-[var(--bg-card)]" data-testid="setup-checklist">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-primary-c">
          Setup checklist <span className="text-muted-c font-normal">· {done} of {items.length} done</span>
        </div>
        <button
          type="button"
          onClick={reset}
          data-testid="setup-checklist-reset"
          className="text-xs text-muted-c hover:text-primary-c underline underline-offset-2"
        >
          Reset list
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex gap-2.5">
            <label className="flex gap-2.5 items-start cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!state[item.id]}
                onChange={() => toggle(item.id)}
                data-testid={`checklist-${item.id}`}
                className="mt-1 w-4 h-4 accent-[var(--brand)] cursor-pointer"
              />
              <span
                className={`text-sm leading-relaxed ${
                  state[item.id] ? "text-muted-c line-through" : "text-secondary-c"
                }`}
              >
                {item.text}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};
