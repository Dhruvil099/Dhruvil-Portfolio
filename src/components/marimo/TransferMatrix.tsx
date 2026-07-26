"use client";

import { useState } from "react";
import { EFFORT_LEVELS, transferMatrix } from "@/data/reasoningEffort";

// Sequential single-hue ramp (orange) for ASR magnitude, anchored for the dark
// surface: near-domain-minimum recedes toward the surface, higher ASR is
// brighter. Monotone lightness; every cell carries a visible label, so color
// never gates the value.
const RAMP = ["#452110", "#8f3d15", "#d95926", "#f2a878"] as const;
const DOMAIN: [number, number] = [20, 50]; // percent — stated on the legend

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function rampColor(pct: number): string {
  const t = Math.min(1, Math.max(0, (pct - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])));
  const pos = t * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(pos));
  const f = pos - i;
  const a = hexToRgb(RAMP[i]);
  const b = hexToRgb(RAMP[i + 1]);
  const mix = a.map((c, k) => Math.round(c + (b[k] - c) * f));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

/** Relative luminance, to pick a label ink that clears contrast on the fill. */
function luminance(rgb: string): number {
  const m = rgb.match(/\d+/g)!.map(Number);
  const [r, g, b] = m.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
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
                  const fill = rampColor(cell.rate);
                  const ink = luminance(fill) >= 0.18 ? "#131313" : "#f4ede7";
                  const isHover = hover?.[0] === ri && hover?.[1] === ci;
                  return (
                    <div
                      key={`${ri}-${ci}`}
                      tabIndex={0}
                      aria-label={`Attack selected against ${EFFORT_LEVELS[ri]}, tested on ${EFFORT_LEVELS[ci]}: ${cell.successes} of ${cell.trials}, ${cell.rate.toFixed(2)} percent attack success`}
                      className="flex min-h-16 cursor-default flex-col items-center justify-center rounded-[3px] py-2 outline-none"
                      style={{
                        background: fill,
                        color: ink,
                        boxShadow: isHover ? "inset 0 0 0 2px #e8ede9" : undefined,
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
          style={{ background: `linear-gradient(90deg, ${RAMP.join(", ")})` }}
        />
        <span>{DOMAIN[1]}%</span>
        <span className="ml-2">attack success rate — brighter = higher</span>
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
