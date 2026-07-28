"use client";

import { useMemo, useState } from "react";

/**
 * Illustrative arithmetic for the article's Section 9 point: a 1% joint
 * failure rate follows from two 10% layers ONLY under independence.
 *
 * This is the article's own hypothetical worked through, not measured data
 * from either study — the caption says so explicitly.
 *
 * For two Bernoulli failures with rates p and q and correlation rho:
 *   P(A and M) = pq + rho * sqrt(p(1-p) q(1-q))
 * bounded by [max(0, p+q-1), min(p, q)].
 */

const W = 720;
const H = 260;
const ML = 58;
const MR = 20;
const MT = 14;
const MB = 42;
const PW = W - ML - MR;
const PH = H - MT - MB;
const SURFACE = "var(--chart-surface)";
const RISK = "var(--series-orange)"; // validated on the dark surface
const NEUTRAL = "var(--chart-muted)";

export default function CorrelatedFailure() {
  const [ratePct, setRatePct] = useState(10); // each layer's failure rate, %
  const [rho, setRho] = useState(0);

  const p = ratePct / 100;
  const sd = Math.sqrt(p * (1 - p) * p * (1 - p)); // q = p here
  const indep = p * p;
  const rhoMin = sd > 0 ? (Math.max(0, 2 * p - 1) - indep) / sd : 0;
  const rhoClamped = Math.min(1, Math.max(rhoMin, rho));
  const joint = indep + rhoClamped * sd;
  const multiplier = indep > 0 ? joint / indep : 0;

  const yMax = Math.max(p * 1.05, 1e-6);
  const x = (r: number) => ML + ((r - rhoMin) / (1 - rhoMin)) * PW;
  const y = (v: number) => MT + (1 - v / yMax) * PH;

  const curve = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const r = rhoMin + (i / 60) * (1 - rhoMin);
      pts.push(`${x(r)},${y(indep + r * sd)}`);
    }
    return pts.join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, rhoMin, indep, sd]);

  const fmtPct = (v: number) => `${(v * 100).toFixed(2)}%`;

  return (
    <div>
      {/* controls */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-3">
          <span className="w-40 shrink-0 text-xs text-ink-2">
            each layer fails on{" "}
            <span className="font-mono text-ink">{ratePct}%</span>
          </span>
          <input
            type="range"
            min={1}
            max={40}
            step={1}
            value={ratePct}
            onChange={(e) => setRatePct(Number(e.target.value))}
            className="w-full"
            aria-label="Per-layer failure rate, percent"
          />
        </label>
        <label className="flex items-center gap-3">
          <span className="w-40 shrink-0 text-xs text-ink-2">
            correlation ρ ={" "}
            <span className="font-mono text-ink">{rhoClamped.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={rhoClamped}
            onChange={(e) => setRho(Number(e.target.value))}
            className="w-full"
            aria-label="Correlation between actor failure and monitor failure"
          />
        </label>
      </div>

      {/* chart */}
      <div style={{ background: SURFACE }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`Joint failure rate rises from ${fmtPct(indep)} under independence to ${fmtPct(p)} at correlation 1, when each layer fails on ${ratePct} percent of scenarios`}
        >
          {/* y gridlines */}
          {[0, yMax / 2, yMax].map((t, i) => (
            <g key={i}>
              <line
                x1={ML}
                x2={ML + PW}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--chart-grid)"
                strokeWidth={1}
              />
              <text
                x={ML - 8}
                y={y(t) + 3.5}
                textAnchor="end"
                fontSize={10.5}
                fill={NEUTRAL}
              >
                {(t * 100).toFixed(1)}%
              </text>
            </g>
          ))}

          {/* independence reference */}
          <line
            x1={ML}
            x2={ML + PW}
            y1={y(indep)}
            y2={y(indep)}
            stroke={NEUTRAL}
            strokeWidth={1}
            strokeDasharray="2 4"
          />
          <text
            x={ML + PW}
            y={y(indep) - 6}
            textAnchor="end"
            fontSize={10}
            fill={NEUTRAL}
          >
            independence assumption {fmtPct(indep)}
          </text>

          {/* the curve */}
          <polyline
            fill="none"
            stroke={RISK}
            strokeWidth={2}
            strokeLinecap="round"
            points={curve}
          />

          {/* selected point, 2px surface ring */}
          <circle
            cx={x(rhoClamped)}
            cy={y(joint)}
            r={5}
            fill={RISK}
            stroke={SURFACE}
            strokeWidth={2}
          />
          <text
            x={Math.min(x(rhoClamped) + 10, ML + PW - 4)}
            y={Math.max(y(joint) - 10, MT + 10)}
            textAnchor={x(rhoClamped) > ML + PW - 90 ? "end" : "start"}
            fontSize={11}
            fill="var(--ink)"
          >
            {fmtPct(joint)} both fail
          </text>

          {/* x ticks */}
          {[rhoMin, 0, 0.5, 1].map((t) => (
            <text
              key={t}
              x={x(t)}
              y={H - MB + 18}
              textAnchor="middle"
              fontSize={10.5}
              fill={NEUTRAL}
            >
              {t === rhoMin ? t.toFixed(2) : t}
            </text>
          ))}
          <text
            x={ML + PW / 2}
            y={H - 6}
            textAnchor="middle"
            fontSize={10.5}
            fill={NEUTRAL}
          >
            correlation between actor failure and monitor failure (ρ)
          </text>
        </svg>
      </div>

      {/* stat tiles */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-bg/50 px-4 py-3">
          <div className="text-xs text-ink-2">assumed (independent)</div>
          <div className="mt-1 font-mono text-xl text-ink">{fmtPct(indep)}</div>
        </div>
        <div className="rounded-lg border border-line bg-bg/50 px-4 py-3">
          <div className="text-xs text-ink-2">actual joint failure</div>
          <div className="mt-1 font-mono text-xl" style={{ color: RISK }}>
            {fmtPct(joint)}
          </div>
        </div>
        <div className="rounded-lg border border-line bg-bg/50 px-4 py-3">
          <div className="text-xs text-ink-2">times worse than assumed</div>
          <div className="mt-1 font-mono text-xl text-ink">
            {multiplier.toFixed(1)}×
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
        At ρ = 1 the two layers fail on exactly the same scenarios, so the
        joint rate equals one layer&apos;s rate ({fmtPct(p)}) and the second
        layer adds nothing. Ambiguous authority, distribution shift, or a
        shared susceptibility to the same phrasing all push ρ above zero, and
        an adaptive adversary has an incentive to search for precisely those
        common causes.
      </p>
    </div>
  );
}
