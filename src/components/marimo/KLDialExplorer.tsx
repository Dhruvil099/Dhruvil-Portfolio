"use client";

import { useMemo, useState } from "react";
import { klData, type KlMetric } from "@/data/klExperiment";

// Chart geometry (viewBox units)
const W = 760;
const H = 330;
const ML = 50;
const MR = 128;
const MT = 14;
const MB = 40;
const PLOT_W = W - ML - MR;
const PLOT_H = H - MT - MB;
const SURFACE = "var(--chart-surface)"; // validated chart surface (dark mode)

const SERIES = [
  { key: "stationary", label: "stationary π(a|s)", color: "var(--series-blue)", dashed: false },
  { key: "timeAware", label: "time-aware πₜ(a|s)", color: "var(--series-orange)", dashed: false },
  { key: "oracle", label: "exact oracle", color: "var(--neutral-mark)", dashed: true },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];

const METRICS: Record<
  KlMetric,
  {
    label: string;
    yLabel: string;
    domain: [number, number];
    ticks: number[];
    fmt: (v: number) => string;
    refLines: { v: number; label: string }[];
  }
> = {
  delivery: {
    label: "Delivery rate",
    yLabel: "delivery rate (task success)",
    domain: [0, 1],
    ticks: [0, 0.25, 0.5, 0.75, 1],
    fmt: (v) => `${(v * 100).toFixed(1)}%`,
    refLines: [],
  },
  excess: {
    label: "Proxy-excess rate",
    yLabel: "episodes with proxy > clean max (1.75)",
    domain: [0, 1],
    ticks: [0, 0.25, 0.5, 0.75, 1],
    fmt: (v) => `${(v * 100).toFixed(1)}%`,
    refLines: [{ v: klData.reference.excess, label: "reference baseline 15.9%" }],
  },
  proxy: {
    label: "Proxy return",
    yLabel: "mean proxy return per episode",
    domain: [0, 8.6],
    ticks: [0, 2, 4, 6, 8],
    fmt: (v) => v.toFixed(2),
    refLines: [
      { v: klData.cleanMax, label: "clean maximum 1.75" },
      { v: klData.reference.proxy, label: "reference policy 1.49" },
    ],
  },
};

const X_TICKS: { i: number; label: string }[] = [
  { i: 0, label: "0" },
  { i: 4, label: "0.01" },
  { i: 8, label: "0.027" },
  { i: 13, label: "0.09" },
  { i: 18, label: "0.3" },
  { i: 23, label: "1" },
];

const x = (i: number) => ML + (i / (klData.betas.length - 1)) * PLOT_W;

function betaLabel(i: number) {
  const b = klData.betas[i];
  return b === 0 ? "0" : String(b);
}

export default function KLDialExplorer() {
  const [metric, setMetric] = useState<KlMetric>("excess");
  const [sel, setSel] = useState(19); // β = 0.3816
  const [hover, setHover] = useState<number | null>(null);

  const cfg = METRICS[metric];
  const y = (v: number) =>
    MT + (1 - (v - cfg.domain[0]) / (cfg.domain[1] - cfg.domain[0])) * PLOT_H;

  const values = useMemo(
    () =>
      Object.fromEntries(
        SERIES.map((s) => [s.key, klData[s.key][metric] as readonly number[]]),
      ) as Record<SeriesKey, readonly number[]>,
    [metric],
  );

  // direct end labels with simple collision resolution (≥15px apart)
  const endLabels = useMemo(() => {
    const items = SERIES.map((s) => ({
      ...s,
      yPos: y(values[s.key][23]),
    })).sort((a, b) => a.yPos - b.yPos);
    for (let i = 1; i < items.length; i++) {
      if (items[i].yPos - items[i - 1].yPos < 15) {
        items[i].yPos = items[i - 1].yPos + 15;
      }
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, metric]);

  const active = hover ?? sel;

  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const frac = Math.min(1, Math.max(0, (px - ML) / PLOT_W));
    setHover(Math.round(frac * (klData.betas.length - 1)));
  };

  return (
    <div>
      {/* controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div
          className="flex rounded-lg border border-line p-0.5"
          role="tablist"
          aria-label="Metric"
        >
          {(Object.keys(METRICS) as KlMetric[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={metric === m}
              onClick={() => setMetric(m)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                metric === m
                  ? "bg-line text-ink"
                  : "text-ink-3 hover:text-ink-2"
              }`}
            >
              {METRICS[m].label}
            </button>
          ))}
        </div>
        <label className="ml-auto flex min-w-56 flex-1 items-center gap-3 sm:flex-none">
          <span className="font-mono text-xs text-ink-2">
            β&nbsp;=&nbsp;{betaLabel(sel)}
          </span>
          <input
            type="range"
            min={0}
            max={klData.betas.length - 1}
            step={1}
            value={sel}
            onChange={(e) => setSel(Number(e.target.value))}
            className="w-full sm:w-44"
            aria-label="KL penalty strength beta"
          />
        </label>
      </div>

      {/* legend */}
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block h-0.5 w-4 rounded-full"
              style={{
                background: s.dashed
                  ? `repeating-linear-gradient(90deg, ${s.color} 0 4px, transparent 4px 7px)`
                  : s.color,
              }}
            />
            {s.label}
          </span>
        ))}
      </div>

      {/* chart */}
      <div className="relative" style={{ background: SURFACE }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none select-none"
          role="img"
          aria-label={`${cfg.label} versus KL penalty strength for stationary, time-aware and oracle policies`}
          onPointerMove={onPointer}
          onPointerDown={(e) => {
            onPointer(e);
            const rect = e.currentTarget.getBoundingClientRect();
            const px = ((e.clientX - rect.left) / rect.width) * W;
            const frac = Math.min(1, Math.max(0, (px - ML) / PLOT_W));
            setSel(Math.round(frac * (klData.betas.length - 1)));
          }}
          onPointerLeave={() => setHover(null)}
        >
          {/* gridlines + y ticks */}
          {cfg.ticks.map((t) => (
            <g key={t}>
              <line
                x1={ML}
                x2={ML + PLOT_W}
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
                fill="var(--chart-muted)"
              >
                {metric === "proxy" ? t : `${Math.round(t * 100)}%`}
              </text>
            </g>
          ))}

          {/* reference lines */}
          {cfg.refLines.map((r) => (
            <g key={r.label}>
              <line
                x1={ML}
                x2={ML + PLOT_W}
                y1={y(r.v)}
                y2={y(r.v)}
                stroke="var(--chart-muted)"
                strokeWidth={1}
                strokeDasharray="2 4"
              />
              <text
                x={ML + PLOT_W - 4}
                y={y(r.v) - 5}
                textAnchor="end"
                fontSize={9.5}
                fill="var(--chart-muted)"
              >
                {r.label}
              </text>
            </g>
          ))}

          {/* x ticks */}
          {X_TICKS.map((t) => (
            <text
              key={t.i}
              x={x(t.i)}
              y={H - MB + 18}
              textAnchor="middle"
              fontSize={10.5}
              fill="var(--chart-muted)"
            >
              {t.label}
            </text>
          ))}
          <text
            x={ML + PLOT_W / 2}
            y={H - 6}
            textAnchor="middle"
            fontSize={10.5}
            fill="var(--chart-muted)"
          >
            KL penalty strength β (geometric grid)
          </text>

          {/* selected-β marker */}
          <line
            x1={x(sel)}
            x2={x(sel)}
            y1={MT}
            y2={MT + PLOT_H}
            stroke="var(--chart-muted)"
            strokeWidth={1.5}
          />
          {hover !== null && hover !== sel && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={MT}
              y2={MT + PLOT_H}
              stroke="var(--chart-grid)"
              strokeWidth={1}
            />
          )}

          {/* series lines */}
          {SERIES.map((s) => (
            <polyline
              key={s.key}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={s.dashed ? "5 5" : undefined}
              points={values[s.key]
                .map((v, i) => `${x(i)},${y(v)}`)
                .join(" ")}
            />
          ))}

          {/* markers at the active index (2px surface ring) */}
          {SERIES.map((s) => (
            <circle
              key={s.key}
              cx={x(active)}
              cy={y(values[s.key][active])}
              r={4.5}
              fill={s.color}
              stroke={SURFACE}
              strokeWidth={2}
            />
          ))}

          {/* direct end labels */}
          {endLabels.map((s) => (
            <g key={s.key}>
              <rect
                x={ML + PLOT_W + 8}
                y={s.yPos - 3}
                width={8}
                height={3}
                rx={1.5}
                fill={s.color}
              />
              <text
                x={ML + PLOT_W + 20}
                y={s.yPos + 2}
                fontSize={10}
                fill="var(--ink-2)"
              >
                {s.label.split(" ")[0]} {cfg.fmt(values[s.key][23])}
              </text>
            </g>
          ))}
        </svg>

        {/* tooltip */}
        {hover !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 rounded-lg border border-line bg-bg/95 px-3 py-2 text-xs shadow-lg"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              transform: x(hover) > W * 0.62 ? "translateX(-108%)" : "translateX(10px)",
            }}
          >
            <div className="mb-1 font-mono text-ink">β = {betaLabel(hover)}</div>
            {SERIES.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5 text-ink-2">
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ background: s.color }}
                />
                {s.label.split(" ")[0]}
                <span className="ml-auto pl-3 font-mono text-ink">
                  {cfg.fmt(values[s.key][hover])}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* stat tiles at the selected β */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {SERIES.map((s) => (
          <div
            key={s.key}
            className="rounded-lg border border-line bg-bg/50 px-4 py-3"
          >
            <div className="flex items-center gap-1.5 text-xs text-ink-2">
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ background: s.color }}
              />
              {s.label}
            </div>
            <div className="mt-1 font-mono text-xl text-ink">
              {cfg.fmt((klData[s.key][metric] as readonly number[])[sel])}
            </div>
            <div className="mt-1 text-[11px] leading-relaxed text-ink-3">
              delivery {(klData[s.key].delivery[sel] * 100).toFixed(1)}% · excess{" "}
              {(klData[s.key].excess[sel] * 100).toFixed(1)}% · proxy{" "}
              {klData[s.key].proxy[sel].toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
        Frozen-policy evaluation: every learned point is the mean over 64
        replicas × 256 fresh episodes (α = 0). Drag the slider or click the
        chart to move β. Pooled Wilson intervals and per-replica ranges are in
        the article text; no β below 1 brings time-aware proxy-excess under
        28.8%.
      </p>

      {/* accessible data table */}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-ink-3 hover:text-ink-2">
          View as data table
        </summary>
        <div className="mt-2 max-h-72 overflow-auto rounded-lg border border-line">
          <table className="w-full border-collapse font-mono text-[11px]">
            <thead className="sticky top-0 bg-surface-2">
              <tr className="text-left text-ink">
                <th className="px-3 py-1.5">β</th>
                {SERIES.map((s) => (
                  <th key={s.key} className="px-3 py-1.5">
                    {s.label.split(" ")[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-ink-2">
              {klData.betas.map((b, i) => (
                <tr
                  key={b}
                  className={i === sel ? "bg-line/40 text-ink" : undefined}
                >
                  <td className="px-3 py-1">{betaLabel(i)}</td>
                  {SERIES.map((s) => (
                    <td key={s.key} className="px-3 py-1">
                      {cfg.fmt((klData[s.key][metric] as readonly number[])[i])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
