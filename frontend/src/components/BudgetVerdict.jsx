/* © 2026 Ayanjit Shome. All rights reserved. Concept by Ayanjit Shome. */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coins, ArrowRight, CheckCircle2, AlertTriangle, Compass } from "lucide-react";
import {
  loadScenario, resolveModel, computeCosts, fmtUsd, DEFAULTS, FALLBACK_MODELS,
} from "@/lib/scenario";

/* "Will $25 last the month?" strip for the Ecosystem Hub home.
 * Reads the Token Economy scenario the user saved locally, fetches live
 * pricing so the model rate matches what they see on the calculator,
 * and renders a one-glance verdict with a CTA to go tune it. */
export const BudgetVerdict = () => {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState(null);
  const [livePricing, setLivePricing] = useState({ models: FALLBACK_MODELS });

  useEffect(() => {
    setScenario(loadScenario());
    const base = import.meta.env.REACT_APP_BACKEND_URL || "";
    let cancelled = false;
    fetch(`${base}/api/pricing`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled && data?.models?.length) setLivePricing(data);
      })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    if (!scenario) return null;
    const model = resolveModel(scenario, livePricing);
    return { model, ...computeCosts(scenario, model) };
  }, [scenario, livePricing]);

  // No saved scenario yet. Soft nudge toward the calculator.
  if (!scenario) {
    return (
      <section
        className="hig-card p-5 fade-up flex flex-wrap items-center justify-between gap-4"
        data-testid="budget-verdict-empty"
        aria-label="Budget verdict"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "var(--brand-soft)" }}>
            <Coins className="w-5 h-5" style={{ color: "var(--brand)" }} aria-hidden="true" />
          </div>
          <div>
            <div className="hig-headline text-primary-c">Will your plan last the month?</div>
            <p className="hig-footnote mt-0.5 max-w-xl">
              Run the Token Economy calculator once and your projected monthly spend will land here on every visit.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/tokeneconomy")}
          data-testid="budget-verdict-cta-empty"
          className="hig-btn hig-btn-primary"
        >
          <Compass className="w-4 h-4" aria-hidden="true" /> Open calculator
        </button>
      </section>
    );
  }

  const overBudget = stats.usdPerMonth > scenario.budgetUsd;
  const tight = !overBudget && stats.monthlyBudgetUsed >= 0.85;
  const verdict = overBudget
    ? { label: "Over budget", color: "var(--warning)", bg: "rgba(255,159,10,0.14)", Icon: AlertTriangle }
    : tight
      ? { label: "Running tight", color: "var(--warning)", bg: "rgba(255,159,10,0.10)", Icon: AlertTriangle }
      : { label: "On track", color: "var(--success)", bg: "rgba(48,209,88,0.14)", Icon: CheckCircle2 };

  const runwayLabel = overBudget
    ? (stats.runwayDays >= 1 ? `${Math.floor(stats.runwayDays)} days until cap` : "<1 day of runway")
    : (stats.monthlyBudgetUsed > 0 ? `${(1 / stats.monthlyBudgetUsed).toFixed(1)} months of runway` : "unlimited runway");

  return (
    <section
      className="hig-card p-5 fade-up"
      data-testid="budget-verdict"
      aria-label={`Budget verdict: ${verdict.label}`}
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: verdict.bg }}>
            <verdict.Icon className="w-5 h-5" style={{ color: verdict.color }} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="hig-headline text-primary-c">
                Will {fmtUsd(scenario.budgetUsd)} last the month?
              </span>
              <span
                className="hig-chip"
                style={{ background: verdict.bg, borderColor: "transparent", color: verdict.color }}
                data-testid="budget-verdict-pill"
              >
                {verdict.label}
              </span>
            </div>
            <p className="hig-footnote mt-0.5">
              {stats.model.label} rates ({`$${stats.model.input}/$${stats.model.output} per 1M`}), {scenario.hoursPerDay}h/day across {scenario.daysPerMonth} days.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 flex-wrap">
          <Metric label="Projected" value={fmtUsd(stats.usdPerMonth)} tone={overBudget ? "warn" : "neutral"} testId="budget-verdict-projected" />
          <Metric label="Of budget used" value={`${Math.min(999, Math.round(stats.monthlyBudgetUsed * 100))}%`} tone={overBudget ? "warn" : "neutral"} testId="budget-verdict-pct" />
          <Metric label={overBudget ? "Runway" : "Runway"} value={runwayLabel} tone={overBudget ? "warn" : "good"} testId="budget-verdict-runway" />
          <button
            type="button"
            onClick={() => navigate("/tokeneconomy")}
            data-testid="budget-verdict-cta"
            className="hig-btn hig-btn-secondary"
          >
            Tune it <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Thin progress bar */}
      <div
        className="mt-4 h-1.5 w-full rounded-full overflow-hidden"
        style={{ background: "var(--bg-card-hover)" }}
        role="progressbar"
        aria-valuenow={Math.min(100, Math.round(stats.monthlyBudgetUsed * 100))}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Monthly budget used"
      >
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${Math.min(100, stats.monthlyBudgetUsed * 100)}%`,
            background: verdict.color,
          }}
        />
      </div>
    </section>
  );
};

const Metric = ({ label, value, tone = "neutral", testId }) => {
  const color =
    tone === "warn" ? "var(--warning)" :
    tone === "good" ? "var(--success)" :
    "var(--text-primary)";
  return (
    <div className="min-w-0" data-testid={testId}>
      <div className="hig-footnote">{label}</div>
      <div className="text-[15px] font-semibold leading-tight tracking-[-0.01em]" style={{ color }}>{value}</div>
    </div>
  );
};
