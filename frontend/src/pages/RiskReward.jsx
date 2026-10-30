/* © 2026 Ayanjit Shome. All rights reserved. Concept by Ayanjit Shome. */
import { useMemo, useState } from "react";
import {
  DollarSign,
  Eye,
  ShieldCheck,
  Brain,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* -------- Section 1: Four concern cards ------
 * Each card is a tight package: title, one-line hook, three concrete signals.
 * Written for mid-level devs and tech leads, no code jargon in the hook. */

const CONCERN_CARDS = [
  {
    id: "cost",
    title: "Cost Management",
    hook: "Compute burns quietly.",
    body: "Assistants bill per token, not per task. Long context, retries, and chatty agents stack up fast.",
    watch: [
      "Unbounded agent loops",
      "Overgrown system prompts",
      "\"Just one more pass\"",
    ],
    tone: "cost",
    Icon: DollarSign,
  },
  {
    id: "visibility",
    title: "Codebase Visibility",
    hook: "You cannot own what you did not read.",
    body: "AI output lands fast. Without review, your repo turns into a stranger. Debugging a module you never read is the slowest form of debugging.",
    watch: [
      "Merged diffs no one explained",
      "Mysterious helper files",
      "Tests that pass without being understood",
    ],
    tone: "visibility",
    Icon: Eye,
  },
  {
    id: "validation",
    title: "Rigorous Validation Overhead",
    hook: "Reviewing takes real time.",
    body: "AI code is cheap to produce and expensive to trust. Verification, tests, and threat modelling do not accelerate with the generation step.",
    watch: [
      "Rubber-stamped pull requests",
      "No test for the new branch of logic",
      "Edge cases discovered in production",
    ],
    tone: "validation",
    Icon: ShieldCheck,
  },
  {
    id: "thinking",
    title: "Critical Thinking Retention",
    hook: "Skills erode without reps.",
    body: "If the assistant writes every loop and every regex, muscle memory fades. Review alone is not practice.",
    watch: [
      "Blanking on fundamentals in interviews",
      "Can no longer sketch a design on paper",
      "Senior juniors who never debugged alone",
    ],
    tone: "thinking",
    Icon: Brain,
  },
];

const toneColor = {
  cost: { bg: "rgba(255, 159, 10, 0.14)",  fg: "#FF9F0A" }, // amber
  visibility: { bg: "rgba(10, 132, 255, 0.14)", fg: "#0A84FF" }, // blue
  validation: { bg: "rgba(48, 209, 88, 0.14)",  fg: "#30D158" }, // green
  thinking: { bg: "rgba(191, 90, 242, 0.14)",   fg: "#BF5AF2" }, // violet
};

const ConcernCard = ({ card }) => {
  const t = toneColor[card.tone];
  const { Icon } = card;
  return (
    <article
      className="surface-card border border-c rounded-[14px] p-5 flex flex-col gap-3 h-full"
      data-testid={`concern-card-${card.id}`}
    >
      <div className="flex items-center gap-3">
        <span
          className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: t.bg, color: t.fg }}
        >
          <Icon className="w-5 h-5" aria-hidden="true" />
        </span>
        <h3 className="hig-headline text-primary-c">{card.title}</h3>
      </div>
      <p className="hig-footnote text-primary-c font-medium">{card.hook}</p>
      <p className="text-[14px] text-secondary-c leading-relaxed">{card.body}</p>
      <ul className="mt-auto pt-2 space-y-1.5">
        {card.watch.map((w, i) => (
          <li key={i} className="hig-footnote text-muted-c flex items-start gap-2">
            <span className="w-1 h-1 rounded-full mt-[7px] shrink-0" style={{ background: t.fg }} />
            <span>{w}</span>
          </li>
        ))}
      </ul>
    </article>
  );
};

/* -------- Section 2: Diminishing Returns chart ------
 * Hand-rolled SVG, dual-axis style. User drags the mph slider to anchor the
 * marker; the two overlaid curves (time saved vs. accident risk) reveal the
 * sweet spot and the cliff. */

const BASELINE_MPH = 40;
const TRIP_MILES = 100;

// Risk curve: ~flat up to 60, then quadratic blow-up. Scaled to 0..100.
const riskAt = (mph) => {
  const x = Math.max(0, mph - 20);
  return Math.min(100, Math.pow(x / 10, 2.2) * 1.1);
};
// Time saved vs the 40 mph baseline, in hours. Diminishing by shape of 1/x.
const timeSavedAt = (mph) => {
  const hours = TRIP_MILES / Math.max(mph, 1);
  const baseline = TRIP_MILES / BASELINE_MPH;
  return Math.max(0, baseline - hours);
};
const MAX_TIME_SAVED = timeSavedAt(120); // Y-axis scale

const CHART_W = 720;
const CHART_H = 300;
const PAD = { top: 32, right: 56, bottom: 44, left: 56 };
const PLOT_W = CHART_W - PAD.left - PAD.right;
const PLOT_H = CHART_H - PAD.top - PAD.bottom;
const MPH_MIN = 20;
const MPH_MAX = 120;

const xForMph = (m) => PAD.left + ((m - MPH_MIN) / (MPH_MAX - MPH_MIN)) * PLOT_W;
const yForTime = (t) => PAD.top + PLOT_H - (t / MAX_TIME_SAVED) * PLOT_H;
const yForRisk = (r) => PAD.top + PLOT_H - (r / 100) * PLOT_H;

const buildPath = (fn) => {
  const points = [];
  for (let m = MPH_MIN; m <= MPH_MAX; m += 1) {
    points.push(`${xForMph(m).toFixed(2)},${fn(m).toFixed(2)}`);
  }
  return "M" + points.join(" L");
};

const buildArea = (fn) => {
  const points = [];
  for (let m = MPH_MIN; m <= MPH_MAX; m += 1) {
    points.push(`${xForMph(m).toFixed(2)},${fn(m).toFixed(2)}`);
  }
  return (
    `M${xForMph(MPH_MIN)},${PAD.top + PLOT_H} L` +
    points.join(" L") +
    ` L${xForMph(MPH_MAX)},${PAD.top + PLOT_H} Z`
  );
};

const DiminishingReturnsChart = () => {
  const [mph, setMph] = useState(70);

  const timePath   = useMemo(() => buildPath((m) => yForTime(timeSavedAt(m))), []);
  const timeArea   = useMemo(() => buildArea((m) => yForTime(timeSavedAt(m))), []);
  const riskPath   = useMemo(() => buildPath((m) => yForRisk(riskAt(m))), []);
  const riskArea   = useMemo(() => buildArea((m) => yForRisk(riskAt(m))), []);

  const t  = timeSavedAt(mph);
  const r  = riskAt(mph);
  const mx = xForMph(mph);

  const verdict = mph < 55
    ? { label: "Safe but slow", color: "#30D158" }
    : mph < 75
      ? { label: "Sweet spot", color: "#30D158" }
      : mph < 95
        ? { label: "Diminishing returns", color: "#FF9F0A" }
        : { label: "Cliff edge", color: "#FF453A" };

  // X-axis grid ticks every 20 mph
  const xTicks = [20, 40, 60, 80, 100, 120];

  return (
    <section
      className="surface-card border border-c rounded-[14px] p-6"
      data-testid="diminishing-returns"
      aria-label="Diminishing returns chart"
    >
      <header className="mb-4">
        <h2 className="text-2xl font-bold text-primary-c flex items-center gap-2 mb-2">
          <Gauge className="w-6 h-6" style={{ color: "#FF9F0A" }} /> Diminishing Returns
        </h2>
        <p className="text-secondary-c max-w-prose leading-relaxed">
          A 100-mile trip. The faster you go, the less extra time you save, and the risk of an accident curves up sharply after 70 mph. The same shape appears when you push an AI assistant from "autocomplete" to "autonomous agent".
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full h-auto"
            role="img"
            aria-label={`At ${mph} miles per hour: ${t.toFixed(2)} hours saved versus the 40 mph baseline, risk index ${Math.round(r)} of 100.`}
            data-testid="diminishing-returns-svg"
          >
            {/* Y grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
              <line
                key={i}
                x1={PAD.left}
                x2={PAD.left + PLOT_W}
                y1={PAD.top + PLOT_H * frac}
                y2={PAD.top + PLOT_H * frac}
                stroke="var(--border-c)"
                strokeWidth="1"
                strokeDasharray="2 4"
                opacity="0.6"
              />
            ))}
            {/* X ticks + labels */}
            {xTicks.map((m) => (
              <g key={m}>
                <line
                  x1={xForMph(m)}
                  x2={xForMph(m)}
                  y1={PAD.top + PLOT_H}
                  y2={PAD.top + PLOT_H + 4}
                  stroke="var(--border-c)"
                />
                <text
                  x={xForMph(m)}
                  y={PAD.top + PLOT_H + 20}
                  fontSize="11"
                  fill="var(--text-muted)"
                  textAnchor="middle"
                >
                  {m}
                </text>
              </g>
            ))}
            {/* X-axis label */}
            <text
              x={PAD.left + PLOT_W / 2}
              y={CHART_H - 6}
              fontSize="12"
              fill="var(--text-secondary)"
              textAnchor="middle"
            >
              Speed (mph)
            </text>

            {/* Left Y label: Time saved */}
            <text
              x={PAD.left - 36}
              y={PAD.top - 14}
              fontSize="11"
              fill="#0A84FF"
              fontWeight="600"
            >
              Time saved (h)
            </text>
            {[0, 0.5, 1, 1.5].map((h) => (
              <text
                key={h}
                x={PAD.left - 8}
                y={yForTime(h) + 4}
                fontSize="11"
                fill="#0A84FF"
                textAnchor="end"
              >
                {h.toFixed(1)}
              </text>
            ))}

            {/* Right Y label: Risk index */}
            <text
              x={PAD.left + PLOT_W + 36}
              y={PAD.top - 14}
              fontSize="11"
              fill="#FF453A"
              fontWeight="600"
              textAnchor="end"
            >
              Risk index
            </text>
            {[0, 25, 50, 75, 100].map((v) => (
              <text
                key={v}
                x={PAD.left + PLOT_W + 8}
                y={yForRisk(v) + 4}
                fontSize="11"
                fill="#FF453A"
                textAnchor="start"
              >
                {v}
              </text>
            ))}

            {/* Shaded cliff zone 85–120 */}
            <rect
              x={xForMph(85)}
              y={PAD.top}
              width={xForMph(120) - xForMph(85)}
              height={PLOT_H}
              fill="#FF453A"
              opacity="0.05"
            />

            {/* Area + lines: time saved (blue) */}
            <path d={timeArea} fill="#0A84FF" opacity="0.08" />
            <path d={timePath} fill="none" stroke="#0A84FF" strokeWidth="2.5" />

            {/* Area + lines: risk (red) */}
            <path d={riskArea} fill="#FF453A" opacity="0.06" />
            <path d={riskPath} fill="none" stroke="#FF453A" strokeWidth="2.5" />

            {/* Vertical marker + dot at current mph */}
            <line
              x1={mx}
              x2={mx}
              y1={PAD.top}
              y2={PAD.top + PLOT_H}
              stroke="var(--text-primary)"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.5"
            />
            <circle
              cx={mx}
              cy={yForTime(t)}
              r="5"
              fill="#0A84FF"
              stroke="var(--bg-primary)"
              strokeWidth="2"
            />
            <circle
              cx={mx}
              cy={yForRisk(r)}
              r="5"
              fill="#FF453A"
              stroke="var(--bg-primary)"
              strokeWidth="2"
            />

            {/* Annotation at 70 (sweet spot) */}
            <g opacity="0.65">
              <line
                x1={xForMph(70)}
                x2={xForMph(70)}
                y1={PAD.top + PLOT_H - 24}
                y2={PAD.top + PLOT_H}
                stroke="#30D158"
                strokeWidth="1.5"
              />
              <text
                x={xForMph(70)}
                y={PAD.top + PLOT_H - 30}
                fontSize="10"
                fill="#30D158"
                textAnchor="middle"
                fontWeight="600"
              >
                Sweet spot
              </text>
            </g>
          </svg>
        </div>

        {/* Interactive slider + readout */}
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="speed-slider" className="hig-headline text-primary-c">
              Speed
            </label>
            <span className="font-mono text-[16px] text-primary-c" data-testid="speed-readout">
              {mph} mph
            </span>
          </div>
          <input
            id="speed-slider"
            type="range"
            min={MPH_MIN}
            max={MPH_MAX}
            step={1}
            value={mph}
            onChange={(e) => setMph(Number(e.target.value))}
            data-testid="speed-slider"
            className="w-full accent-[color:var(--brand)] cursor-pointer"
            aria-valuetext={`${mph} miles per hour`}
          />
          <div className="grid grid-cols-3 gap-3">
            <div className="surface-secondary border border-c rounded-[10px] p-3">
              <div className="hig-footnote text-muted-c">Time saved</div>
              <div className="font-mono text-[15px]" style={{ color: "#0A84FF" }} data-testid="time-saved-readout">
                {t.toFixed(2)} h
              </div>
            </div>
            <div className="surface-secondary border border-c rounded-[10px] p-3">
              <div className="hig-footnote text-muted-c">Risk index</div>
              <div className="font-mono text-[15px]" style={{ color: "#FF453A" }} data-testid="risk-readout">
                {Math.round(r)} / 100
              </div>
            </div>
            <div className="surface-secondary border border-c rounded-[10px] p-3">
              <div className="hig-footnote text-muted-c">Verdict</div>
              <div className="font-medium text-[15px]" style={{ color: verdict.color }} data-testid="verdict-readout">
                {verdict.label}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* -------- Section 3: Task Delegation Matrix ------
 * 2x2 grid, inverse of the usual advice: AI for the big complex work,
 * manual coding for the small stuff so skills do not atrophy. */

const MATRIX_CELLS = [
  // Row 1: MANUAL
  {
    id: "manual-low",
    row: 0, col: 0,
    row_label: "Manual code",
    col_label: "Low complexity",
    title: "Keep sharp",
    tone: "best",
    body: "Write small, well-scoped work yourself. This is where your fundamentals stay fresh.",
    examples: [
      "A 20-line utility helper",
      "A quick bug fix with a known root cause",
      "A short SQL query you understand",
    ],
  },
  {
    id: "manual-high",
    row: 0, col: 1,
    row_label: "Manual code",
    col_label: "High complexity",
    title: "Slow and leverage-starved",
    tone: "amber",
    body: "Hand-rolling a large system from scratch costs weeks the business cannot afford. Partner with AI on scaffolding and reviews.",
    examples: [
      "Rewriting a billing engine solo",
      "Hand-crafting a 50-table migration",
      "Building a design system without any generation",
    ],
  },
  // Row 2: AI
  {
    id: "ai-low",
    row: 1, col: 0,
    row_label: "AI delegate",
    col_label: "Low complexity",
    title: "Skill atrophy risk",
    tone: "amber",
    body: "If every one-liner comes from a prompt, muscle memory fades. Review only is not practice.",
    examples: [
      "Prompting for a trivial regex",
      "Asking for a known array method",
      "Generating a two-line helper you could type in 15 seconds",
    ],
  },
  {
    id: "ai-high",
    row: 1, col: 1,
    row_label: "AI delegate",
    col_label: "High complexity",
    title: "Optimal AI use",
    tone: "best",
    body: "Scaffold, refactor, and translate across layers. You still own the architecture, review, and tests.",
    examples: [
      "Scaffolding a new microservice",
      "Converting a module between frameworks",
      "Drafting integration tests for a large API surface",
    ],
  },
];

const matrixTone = {
  best:  { bg: "rgba(48, 209, 88, 0.10)", border: "rgba(48, 209, 88, 0.45)", fg: "#30D158", label: "Optimal" },
  amber: { bg: "rgba(255, 159, 10, 0.10)", border: "rgba(255, 159, 10, 0.45)", fg: "#FF9F0A", label: "Caution" },
  risk:  { bg: "rgba(255, 69, 58, 0.10)",  border: "rgba(255, 69, 58, 0.45)",  fg: "#FF453A", label: "High risk" },
};

const MatrixCell = ({ cell }) => {
  const t = matrixTone[cell.tone];
  return (
    <article
      className="rounded-[14px] p-5 flex flex-col gap-3 h-full border"
      style={{ background: t.bg, borderColor: t.border }}
      data-testid={`matrix-cell-${cell.id}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="hig-headline text-primary-c">{cell.title}</h3>
        <span
          className="hig-chip"
          style={{ background: "transparent", borderColor: t.border, color: t.fg }}
        >
          {t.label}
        </span>
      </div>
      <p className="text-[14px] text-secondary-c leading-relaxed">{cell.body}</p>
      <ul className="mt-auto pt-1 space-y-1.5">
        {cell.examples.map((ex, i) => (
          <li key={i} className="hig-footnote text-muted-c flex items-start gap-2">
            <span className="w-1 h-1 rounded-full mt-[7px] shrink-0" style={{ background: t.fg }} />
            <span>{ex}</span>
          </li>
        ))}
      </ul>
    </article>
  );
};

const TaskMatrix = () => (
  <section
    className="surface-card border border-c rounded-[14px] p-6"
    data-testid="task-delegation-matrix"
    aria-label="Task delegation matrix"
  >
    <header className="mb-5">
      <h2 className="text-2xl font-bold text-primary-c flex items-center gap-2 mb-2">
        <Brain className="w-6 h-6" style={{ color: "#BF5AF2" }} /> Task Delegation Matrix
      </h2>
      <p className="text-secondary-c max-w-prose leading-relaxed">
        The usual advice flipped on its head: use the assistant where it earns the most leverage, and write the small stuff yourself to keep the craft sharp.
      </p>
    </header>

    {/* Axis labels + grid */}
    <div className="grid gap-3" style={{ gridTemplateColumns: "auto 1fr 1fr" }}>
      <div />
      <div className="hig-footnote text-muted-c text-center">Low complexity</div>
      <div className="hig-footnote text-muted-c text-center">High complexity</div>

      <div className="hig-footnote text-muted-c self-center -rotate-90 origin-center whitespace-nowrap" style={{ width: "1rem" }}>
        Manual
      </div>
      <MatrixCell cell={MATRIX_CELLS[0]} />
      <MatrixCell cell={MATRIX_CELLS[1]} />

      <div className="hig-footnote text-muted-c self-center -rotate-90 origin-center whitespace-nowrap" style={{ width: "1rem" }}>
        AI
      </div>
      <MatrixCell cell={MATRIX_CELLS[2]} />
      <MatrixCell cell={MATRIX_CELLS[3]} />
    </div>
  </section>
);

/* -------- Page composition ------ */

const ACCENT = "#FF453A";

export default function RiskReward() {
  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 space-y-14 fade-up" data-testid="risk-reward-page">
      <section>
        <div
          className="text-xs uppercase tracking-[0.25em] font-semibold mb-3 flex items-center gap-2"
          style={{ color: ACCENT }}
        >
          <Gauge className="w-4 h-4" aria-hidden="true" /> {"// strategic ai usage"}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-primary-c max-w-3xl">
          Risk <span style={{ color: ACCENT }}>vs. Reward</span>
        </h1>
        <p className="text-secondary-c mt-3 max-w-2xl leading-relaxed">
          A field guide for developers and tech leads choosing where AI pays off and where it quietly costs you. Three views: the core concerns, the shape of the trade-off, and a matrix for the next pull request.
        </p>
      </section>

      <section data-testid="concern-cards">
        <h2 className="text-2xl font-bold text-primary-c flex items-center gap-2 mb-5">
          <ShieldCheck className="w-6 h-6" style={{ color: "#30D158" }} /> Core concerns
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CONCERN_CARDS.map((c) => (
            <ConcernCard key={c.id} card={c} />
          ))}
        </div>
      </section>

      <DiminishingReturnsChart />

      <TaskMatrix />
    </div>
  );
}
