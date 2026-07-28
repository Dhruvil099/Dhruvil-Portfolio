"use client";

import { Fragment, useState } from "react";
import {
  EFFORT_LEVELS,
  outcomes,
  type EffortLevel,
  type Outcome,
  type OutcomeKey,
} from "@/data/reasoningEffort";

// Chart geometry (viewBox units)
const W = 760;
const H = 320;
const PLOT_TOP = 40;
const PLOT_BOTTOM = 252;
const A_LEFT = 64;
const A_RIGHT = 460;
const B_LEFT = 540;
const B_RIGHT = 728;
const ROW_Y: Record<EffortLevel, number> = { low: 78, medium: 148, high: 218 };
const DIFF_Y = 148;
const SURFACE = "var(--chart-surface)"; // validated chart surface (dark mode)

// Ordinal single-hue ramp for the ordered effort variable (validated with the
// palette script: monotone L, ΔL ≥ 0.06, near-surface end 2.63:1 — relief via
// direct labels + table view). Brighter = more configured effort.
const EFFORT_COLOR: Record<EffortLevel, string> = {
  low: "var(--effort-low)",
  medium: "var(--series-blue)",
  high: "var(--effort-high)",
};
const DIFF_COLOR = "var(--neutral-mark)"; // neutral — the contrast is unresolved

type PanelCfg = {
  domainA: [number, number];
  ticksA: number[];
  domainB: [number, number];
  ticksB: number[];
  directionNote: string;
  takeaway: string;
};

const PANELS: Record<OutcomeKey, PanelCfg> = {
  clean: {
    domainA: [48, 80],
    ticksA: [50, 60, 70, 80],
    domainB: [-10, 10],
    ticksB: [-10, -5, 0, 5, 10],
    directionNote: "right of 0 = more clean completions",
    takeaway:
      "High effort completed eight more clean trajectories than low, but the interval around the paired difference includes both no effect and a moderately useful improvement.",
  },
  fixedAsr: {
    domainA: [15, 32],
    ticksA: [15, 20, 25, 30],
    domainB: [-6, 6],
    ticksB: [-6, -3, 0, 3, 6],
    directionNote: "right of 0 = higher ASR (unsafe)",
    takeaway:
      "The preregistered hypothesis predicted lower ASR at higher effort. The observed ordering went the other way, and the interval spans zero — neither a reversal nor proof of equivalence.",
  },
  selectedAsr: {
    domainA: [20, 52],
    ticksA: [20, 30, 40, 50],
    domainB: [-6, 6],
    ticksB: [-6, -3, 0, 3, 6],
    directionNote: "right of 0 = higher ASR (unsafe)",
    takeaway:
      "One selected template, not three distinct attacks: every effort's search chose the same authority_update prompt, and the validation partition also selected the winner.",
  },
  secure: {
    domainA: [27, 49],
    ticksA: [30, 35, 40, 45],
    domainB: [-6, 6],
    ticksB: [],
    directionNote: "",
    takeaway:
      "An agent that merely refuses everything can achieve low ASR while failing the user. This joint metric did not shift favourably with configured effort; no high − low contrast was reported.",
  },
};

const fmtSigned = (v: number, dp = 2) =>
  `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(dp)}`;
const fmtP = (p: number) => `p = ${p.toFixed(3).replace(/^0\./, ".")}`;

type Hover = { kind: "effort"; effort: EffortLevel } | { kind: "diff" } | null;

export default function EffortCIExplorer() {
  const [key, setKey] = useState<OutcomeKey>("fixedAsr");
  const [hover, setHover] = useState<Hover>(null);

  const outcome = outcomes.find((o) => o.key === key) as Outcome;
  const cfg = PANELS[key];

  const xA = (v: number) =>
    A_LEFT + ((v - cfg.domainA[0]) / (cfg.domainA[1] - cfg.domainA[0])) * (A_RIGHT - A_LEFT);
  const xB = (v: number) =>
    B_LEFT + ((v - cfg.domainB[0]) / (cfg.domainB[1] - cfg.domainB[0])) * (B_RIGHT - B_LEFT);

  // Region inside all three 95% CIs — the honest headline of this study.
  const bandLow = Math.max(...EFFORT_LEVELS.map((e) => outcome.perEffort[e].ciLow));
  const bandHigh = Math.min(...EFFORT_LEVELS.map((e) => outcome.perEffort[e].ciHigh));

  const tooltip = (() => {
    if (!hover) return null;
    if (hover.kind === "effort") {
      const s = outcome.perEffort[hover.effort];
      return {
        x: xA(s.rate),
        y: ROW_Y[hover.effort],
        title: `${hover.effort} effort`,
        color: EFFORT_COLOR[hover.effort],
        lines: [
          `${s.successes}/${s.trials} = ${s.rate.toFixed(2)}%`,
          `95% CI [${s.ciLow.toFixed(2)}, ${s.ciHigh.toFixed(2)}]`,
        ],
      };
    }
    if (!outcome.diff) return null;
    return {
      x: xB(outcome.diff.estimate),
      y: DIFF_Y,
      title: "high − low",
      color: DIFF_COLOR,
      lines: [
        `${fmtSigned(outcome.diff.estimate)} pp, ${fmtP(outcome.diff.p)}`,
        `95% CI [${fmtSigned(outcome.diff.ciLow)}, ${fmtSigned(outcome.diff.ciHigh)}]`,
      ],
    };
  })();

  return (
    <div>
      {/* outcome tabs */}
      <div
        className="mb-3 flex flex-wrap rounded-lg border border-line p-0.5"
        role="tablist"
        aria-label="Outcome"
      >
        {outcomes.map((o) => (
          <button
            key={o.key}
            role="tab"
            aria-selected={key === o.key}
            onClick={() => {
              setKey(o.key);
              setHover(null);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              key === o.key ? "bg-line text-ink" : "text-ink-3 hover:text-ink-2"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* effort ramp legend */}
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
        <span className="text-ink-3">configured effort</span>
        {EFFORT_LEVELS.map((e) => (
          <span key={e} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-full"
              style={{ background: EFFORT_COLOR[e] }}
            />
            {e}
          </span>
        ))}
        <span className="text-ink-3">(one hue — effort is ordered, not categorical)</span>
      </div>

      {/* chart */}
      <div className="relative" style={{ background: SURFACE }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full select-none"
          role="img"
          aria-label={`${outcome.label} at low, medium and high reasoning effort with task-clustered 95% confidence intervals, and the unresolved high minus low difference`}
        >
          {/* panel titles */}
          <text x={A_LEFT} y={24} fontSize={10} fill="var(--chart-muted)">
            rate per effort · task-clustered 95% CI
          </text>
          <text x={B_LEFT} y={24} fontSize={10} fill="var(--chart-muted)">
            high − low (pp)
          </text>
          {outcome.diff ? (
            <text x={B_LEFT} y={37} fontSize={8.5} fill="var(--chart-muted)">
              {cfg.directionNote}
            </text>
          ) : null}

          {/* ── Panel A: rates with CIs ── */}
          {cfg.ticksA.map((t) => (
            <g key={`ta-${t}`}>
              <line x1={xA(t)} x2={xA(t)} y1={PLOT_TOP} y2={PLOT_BOTTOM} stroke="var(--chart-grid)" strokeWidth={1} />
              <text x={xA(t)} y={PLOT_BOTTOM + 16} textAnchor="middle" fontSize={10.5} fill="var(--chart-muted)">
                {t}%
              </text>
            </g>
          ))}
          <text
            x={(A_LEFT + A_RIGHT) / 2}
            y={H - 10}
            textAnchor="middle"
            fontSize={10.5}
            fill="var(--chart-muted)"
          >
            % of trajectories
          </text>

          {/* overlap band — all three intervals share this region */}
          {bandHigh > bandLow ? (
            <g>
              <rect
                x={xA(bandLow)}
                y={PLOT_TOP}
                width={xA(bandHigh) - xA(bandLow)}
                height={PLOT_BOTTOM - PLOT_TOP}
                fill="var(--ink)"
                opacity={0.05}
              />
              <text
                x={(xA(bandLow) + xA(bandHigh)) / 2}
                y={PLOT_TOP + 12}
                textAnchor="middle"
                fontSize={9}
                fill="var(--chart-muted)"
              >
                all three CIs overlap here
              </text>
            </g>
          ) : null}

          {EFFORT_LEVELS.map((e) => {
            const s = outcome.perEffort[e];
            const y = ROW_Y[e];
            return (
              <g key={e}>
                {/* row label */}
                <circle cx={14} cy={y} r={4} fill={EFFORT_COLOR[e]} />
                <text x={24} y={y + 3.5} fontSize={11} fill="var(--ink-2)">
                  {e}
                </text>
                {/* 95% CI — drawn heavier than anything else on purpose */}
                <line
                  x1={xA(s.ciLow)}
                  x2={xA(s.ciHigh)}
                  y1={y}
                  y2={y}
                  stroke={EFFORT_COLOR[e]}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <text x={xA(s.ciLow)} y={y + 17} textAnchor="middle" fontSize={9} fill="var(--chart-muted)">
                  {s.ciLow.toFixed(2)}
                </text>
                <text x={xA(s.ciHigh)} y={y + 17} textAnchor="middle" fontSize={9} fill="var(--chart-muted)">
                  {s.ciHigh.toFixed(2)}
                </text>
                {/* point estimate (2px surface ring) */}
                <circle cx={xA(s.rate)} cy={y} r={5} fill={EFFORT_COLOR[e]} stroke={SURFACE} strokeWidth={2} />
                <text x={xA(s.rate)} y={y - 11} textAnchor="middle" fontSize={11} fill="var(--ink)">
                  {s.rate.toFixed(2)}%
                  <tspan fontSize={9.5} fill="var(--chart-muted)">
                    {" "}
                    · {s.successes}/{s.trials}
                  </tspan>
                </text>
                {/* hover / focus hit target (much bigger than the mark) */}
                <rect
                  x={0}
                  y={y - 33}
                  width={A_RIGHT + 14}
                  height={66}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${e} effort: ${s.successes} of ${s.trials}, ${s.rate.toFixed(2)} percent, 95 percent CI ${s.ciLow.toFixed(2)} to ${s.ciHigh.toFixed(2)}`}
                  style={{ outline: "none" }}
                  onPointerEnter={() => setHover({ kind: "effort", effort: e })}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover({ kind: "effort", effort: e })}
                  onBlur={() => setHover(null)}
                />
              </g>
            );
          })}

          {/* ── Panel B: high − low difference vs zero ── */}
          {outcome.diff ? (
            <g>
              {cfg.ticksB.map((t) => (
                <g key={`tb-${t}`}>
                  <line
                    x1={xB(t)}
                    x2={xB(t)}
                    y1={PLOT_TOP}
                    y2={PLOT_BOTTOM}
                    stroke={t === 0 ? "var(--chart-muted)" : "var(--chart-grid)"}
                    strokeWidth={t === 0 ? 1.5 : 1}
                  />
                  <text x={xB(t)} y={PLOT_BOTTOM + 16} textAnchor="middle" fontSize={10.5} fill="var(--chart-muted)">
                    {t === 0 ? "0" : fmtSigned(t, 0)}
                  </text>
                </g>
              ))}
              <text
                x={xB(0)}
                y={PLOT_TOP + 12}
                textAnchor="middle"
                fontSize={9}
                fill="var(--chart-muted)"
                stroke={SURFACE}
                strokeWidth={4}
                paintOrder="stroke"
              >
                no effect
              </text>
              <text
                x={(B_LEFT + B_RIGHT) / 2}
                y={H - 10}
                textAnchor="middle"
                fontSize={10.5}
                fill="var(--chart-muted)"
              >
                percentage points
              </text>
              <line
                x1={xB(outcome.diff.ciLow)}
                x2={xB(outcome.diff.ciHigh)}
                y1={DIFF_Y}
                y2={DIFF_Y}
                stroke={DIFF_COLOR}
                strokeWidth={3}
                strokeLinecap="round"
              />
              <text x={xB(outcome.diff.ciLow)} y={DIFF_Y + 17} textAnchor="middle" fontSize={9} fill="var(--chart-muted)">
                {fmtSigned(outcome.diff.ciLow)}
              </text>
              <text x={xB(outcome.diff.ciHigh)} y={DIFF_Y + 17} textAnchor="middle" fontSize={9} fill="var(--chart-muted)">
                {fmtSigned(outcome.diff.ciHigh)}
              </text>
              <circle
                cx={xB(outcome.diff.estimate)}
                cy={DIFF_Y}
                r={5}
                fill={DIFF_COLOR}
                stroke={SURFACE}
                strokeWidth={2}
              />
              <text x={xB(outcome.diff.estimate)} y={DIFF_Y - 11} textAnchor="middle" fontSize={11} fill="var(--ink)">
                {fmtSigned(outcome.diff.estimate)} pp
              </text>
              <text x={xB(outcome.diff.estimate)} y={DIFF_Y + 32} textAnchor="middle" fontSize={9.5} fill="var(--chart-muted)">
                {fmtP(outcome.diff.p)}
              </text>
              <rect
                x={B_LEFT - 30}
                y={DIFF_Y - 40}
                width={B_RIGHT - B_LEFT + 60}
                height={80}
                fill="transparent"
                tabIndex={0}
                aria-label={`High minus low difference ${fmtSigned(outcome.diff.estimate)} percentage points, 95 percent CI ${fmtSigned(outcome.diff.ciLow)} to ${fmtSigned(outcome.diff.ciHigh)}, ${fmtP(outcome.diff.p)}. The interval crosses zero.`}
                style={{ outline: "none" }}
                onPointerEnter={() => setHover({ kind: "diff" })}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover({ kind: "diff" })}
                onBlur={() => setHover(null)}
              />
            </g>
          ) : (
            <g>
              <text x={(B_LEFT + B_RIGHT) / 2} y={DIFF_Y - 8} textAnchor="middle" fontSize={10.5} fill="var(--chart-muted)">
                no high − low contrast
              </text>
              <text x={(B_LEFT + B_RIGHT) / 2} y={DIFF_Y + 8} textAnchor="middle" fontSize={10.5} fill="var(--chart-muted)">
                reported for this outcome
              </text>
            </g>
          )}
        </svg>

        {/* tooltip */}
        {tooltip ? (
          <div
            className="pointer-events-none absolute z-10 rounded-lg border border-line bg-bg/95 px-3 py-2 text-xs shadow-lg"
            style={{
              left: `${(tooltip.x / W) * 100}%`,
              top: `${(tooltip.y / H) * 100}%`,
              transform:
                tooltip.x > W * 0.62
                  ? "translate(-104%, -130%)"
                  : "translate(10px, -130%)",
            }}
          >
            <div className="mb-0.5 flex items-center gap-1.5 font-mono text-ink">
              <span aria-hidden className="size-2 rounded-full" style={{ background: tooltip.color }} />
              {tooltip.title}
            </div>
            {tooltip.lines.map((l) => (
              <div key={l} className="font-mono text-ink-2">
                {l}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink-2">{cfg.takeaway}</p>

      <p className="mt-2 text-[11px] leading-relaxed text-ink-3">
        Counts, rates and intervals are verbatim from the finalised runs: 10,000
        task-clustered percentile-bootstrap resamples, with task IDs and seeds
        paired across effort conditions. Every reported high − low interval
        crosses zero — no outcome shows a statistically resolved effect of
        configured reasoning effort, in either direction.
      </p>

      {/* accessible data table */}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-ink-3 hover:text-ink-2">
          View as data table
        </summary>
        <div className="mt-2 max-h-80 overflow-auto rounded-lg border border-line">
          <table className="w-full border-collapse font-mono text-[11px]">
            <thead className="sticky top-0 bg-surface-2">
              <tr className="text-left text-ink">
                <th className="px-3 py-1.5">Outcome</th>
                <th className="px-3 py-1.5">Effort</th>
                <th className="px-3 py-1.5">Count</th>
                <th className="px-3 py-1.5">Rate</th>
                <th className="px-3 py-1.5">95% CI</th>
              </tr>
            </thead>
            <tbody className="text-ink-2">
              {outcomes.map((o) => (
                <Fragment key={o.key}>
                  {EFFORT_LEVELS.map((e) => {
                    const s = o.perEffort[e];
                    return (
                      <tr key={`${o.key}-${e}`} className={o.key === key ? "bg-line/40 text-ink" : undefined}>
                        <td className="px-3 py-1">{e === "low" ? o.label : ""}</td>
                        <td className="px-3 py-1">{e}</td>
                        <td className="px-3 py-1">
                          {s.successes}/{s.trials}
                        </td>
                        <td className="px-3 py-1">{s.rate.toFixed(2)}%</td>
                        <td className="px-3 py-1">
                          [{s.ciLow.toFixed(2)}, {s.ciHigh.toFixed(2)}]
                        </td>
                      </tr>
                    );
                  })}
                  <tr key={`${o.key}-diff`} className={o.key === key ? "bg-line/40 text-ink" : undefined}>
                    <td className="px-3 py-1" />
                    <td className="px-3 py-1">high − low</td>
                    <td className="px-3 py-1">—</td>
                    <td className="px-3 py-1">
                      {o.diff ? `${fmtSigned(o.diff.estimate)} pp` : "not reported"}
                    </td>
                    <td className="px-3 py-1">
                      {o.diff
                        ? `[${fmtSigned(o.diff.ciLow)}, ${fmtSigned(o.diff.ciHigh)}], ${fmtP(o.diff.p)}`
                        : "—"}
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
