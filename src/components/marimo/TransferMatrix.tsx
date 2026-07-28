"use client";

import { useState } from "react";
import { EFFORT_LEVELS, transferMatrix } from "@/data/reasoningEffort";

// Sequential single-hue ramp (orange) for ASR magnitude. The four stops live
// in CSS (--tm-0..3) so each theme gets steps anchored to its own surface; the
// component only computes WHERE in the ramp a value sits and lets CSS
// color-mix() interpolate. Label ink is likewise a per-stop token, so no
// colour maths happens in JS and nothing depends on the active theme at
// render time. Every cell carries a visible label, so colour never gates the
// value.
const STOPS = 4;
const DOMAIN: [number, number] = [20, 50]; // percent — stated on the legend

/** Background + label ink for a cell, expressed purely as CSS. */
function rampStyle(pct: number): { background: string; color: string } {
  const t = Math.min(1, Math.max(0, (pct - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])));
  const pos = t * (STOPS - 1);
  const i = Math.min(STOPS - 2, Math.floor(pos));
  const f = (pos - i) * 100;
  return {
    background: `color-mix(in srgb, var(--tm-${i + 1}) ${f}%, var(--tm-${i}))`,
    color: `var(--tm-ink-${Math.round(pos)})`,
  };
}

export default function TransferMatrix() {
  const [hover, setHover] = useState<[number, number] | null>(null);

  return (
    <div>
      <div className="grid grid-cols-[auto_1fr] gap-2">
        {/* row-axis title */}
        <div className="flex items-center">
          <span
            className="font-mono text-[10px] uppercase tracking-wider text-ink-3"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            selected against ↓
          </span>
        </div>

        <div>
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">
            tested on →
          </div>
          {/* column headers */}
          <div className="grid grid-cols-[64px_repeat(3,1fr)] gap-0.5">
            <div />
            {EFFORT_LEVELS.map((t) => (
              <div key={t} className="pb-1 text-center text-xs text-ink-2">
                {t}
              </div>
            ))}
            {/* cells */}
            {transferMatrix.map((row, ri) => (
              <div key={EFFORT_LEVELS[ri]} className="contents">
                <div className="flex items-center justify-end pr-2 text-xs text-ink-2">
                  {EFFORT_LEVELS[ri]}
                </div>
                {row.map((cell, ci) => {
                  const swatch = rampStyle(cell.rate);
                  const isHover = hover?.[0] === ri && hover?.[1] === ci;
                  return (
                    <div
                      key={`${ri}-${ci}`}
                      tabIndex={0}
                      aria-label={`Attack selected against ${EFFORT_LEVELS[ri]}, tested on ${EFFORT_LEVELS[ci]}: ${cell.successes} of ${cell.trials}, ${cell.rate.toFixed(2)} percent attack success`}
                      className="flex min-h-16 cursor-default flex-col items-center justify-center rounded-[3px] py-2 outline-none"
                      style={{
                        ...swatch,
                        boxShadow: isHover
                          ? "inset 0 0 0 2px var(--ink)"
                          : undefined,
                      }}
                      onPointerEnter={() => setHover([ri, ci])}
                      onPointerLeave={() => setHover(null)}
                      onFocus={() => setHover([ri, ci])}
                      onBlur={() => setHover(null)}
                    >
                      <span className="font-mono text-sm font-semibold">
                        {cell.rate.toFixed(2)}%
                      </span>
                      <span className="font-mono text-[10px] opacity-80">
                        {cell.successes}/{cell.trials}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* hover readout (values are already visible in every cell) */}
      <div className="mt-2 h-5 font-mono text-[11px] text-ink-3" aria-hidden>
        {hover
          ? `selected against ${EFFORT_LEVELS[hover[0]]} → tested on ${EFFORT_LEVELS[hover[1]]}: ${transferMatrix[hover[0]][hover[1]].successes}/96 = ${transferMatrix[hover[0]][hover[1]].rate.toFixed(2)}%`
          : "hover a cell for the pairing"}
      </div>

      {/* scale legend */}
      <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-3">
        <span>{DOMAIN[0]}%</span>
        <span
          aria-hidden
          className="h-2 w-32 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, var(--tm-0), var(--tm-1), var(--tm-2), var(--tm-3))",
          }}
        />
        <span>{DOMAIN[1]}%</span>
        <span className="ml-2">attack success rate — stronger colour = higher</span>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
        Exploratory pilot only, 96 trajectories per cell. Every source row
        selected the same literal template (<code>authority_update</code>), so
        the row labels do not encode distinct attacks and this matrix{" "}
        <strong className="text-ink-2">cannot measure transfer asymmetry</strong>.
        High effort was directionally the lowest-ASR target in each row, but all
        task-clustered intervals overlap — at most this is a noisy pilot
        comparison of target effort under repeated uses of one template.
      </p>
    </div>
  );
}
