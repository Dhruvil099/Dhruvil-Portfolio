// Counts, rates and task-clustered 95% CIs from the reasoning-effort study
// ("No resolved safety effect of reasoning effort under indirect prompt
// injection"). Every number is copied verbatim from the write-up's tables —
// confirmatory baseline / search CSVs identified by the SHA-256 hashes in the
// article's reproducibility record. Rates and CI bounds are percentages;
// differences are percentage points (high minus low).

export const NOTEBOOK_URL =
  "https://molab.marimo.io/notebooks/nb_TZRxUhXprugmvKP3t8e1rN";

export type EffortLevel = "low" | "medium" | "high";

export const EFFORT_LEVELS: readonly EffortLevel[] = ["low", "medium", "high"];

export type EffortStat = {
  successes: number;
  trials: number;
  rate: number; // percent
  ciLow: number; // percent
  ciHigh: number; // percent
};

export type HighMinusLow = {
  estimate: number; // percentage points
  ciLow: number;
  ciHigh: number;
  p: number;
};

export type OutcomeKey = "clean" | "fixedAsr" | "selectedAsr" | "secure";

export type Outcome = {
  key: OutcomeKey;
  label: string;
  /** Whether a higher rate is the safe/desired direction. */
  higherIsBetter: boolean;
  perEffort: Record<EffortLevel, EffortStat>;
  /** Absent where the write-up reports no high−low contrast (secure task success). */
  diff?: HighMinusLow;
};

export const outcomes: readonly Outcome[] = [
  {
    key: "clean",
    label: "Clean task completion",
    higherIsBetter: true,
    perEffort: {
      low: { successes: 187, trials: 300, rate: 62.33, ciLow: 51.67, ciHigh: 73.0 },
      medium: { successes: 194, trials: 300, rate: 64.67, ciLow: 54.33, ciHigh: 74.67 },
      high: { successes: 195, trials: 300, rate: 65.0, ciLow: 54.67, ciHigh: 74.67 },
    },
    diff: { estimate: 2.67, ciLow: -2.33, ciHigh: 8.33, p: 0.296 },
  },
  {
    key: "fixedAsr",
    label: "Fixed official-attack ASR",
    higherIsBetter: false,
    perEffort: {
      low: { successes: 180, trials: 800, rate: 22.5, ciLow: 17.75, ciHigh: 27.5 },
      medium: { successes: 194, trials: 800, rate: 24.25, ciLow: 19.5, ciHigh: 29.25 },
      high: { successes: 193, trials: 800, rate: 24.13, ciLow: 19.5, ciHigh: 29.13 },
    },
    diff: { estimate: 1.63, ciLow: -1.88, ciHigh: 5.25, p: 0.338 },
  },
  {
    key: "selectedAsr",
    label: "Selected-template ASR",
    higherIsBetter: false,
    perEffort: {
      low: { successes: 85, trials: 240, rate: 35.42, ciLow: 24.17, ciHigh: 46.67 },
      medium: { successes: 88, trials: 240, rate: 36.67, ciLow: 25.83, ciHigh: 47.92 },
      high: { successes: 86, trials: 240, rate: 35.83, ciLow: 24.58, ciHigh: 47.5 },
    },
    diff: { estimate: 0.42, ciLow: -4.17, ciHigh: 5.42, p: 0.924 },
  },
  {
    key: "secure",
    label: "Secure task success",
    higherIsBetter: true,
    perEffort: {
      low: { successes: 319, trials: 800, rate: 39.88, ciLow: 33.88, ciHigh: 46.0 },
      medium: { successes: 289, trials: 800, rate: 36.13, ciLow: 29.75, ciHigh: 42.5 },
      high: { successes: 293, trials: 800, rate: 36.63, ciLow: 30.75, ciHigh: 42.63 },
    },
    // The write-up reports no high−low contrast for this outcome.
  },
] as const;

// ── Exploratory pilot 3×3 transfer matrix ───────────────────────────────────
// 96 trajectories per cell. Every "source" row selected the same literal
// template (authority_update), so the matrix cannot measure transfer
// asymmetry — see the article's caveats.

export type TransferCell = {
  successes: number;
  trials: number;
  rate: number; // percent
};

/** Rows: attack selected against low/medium/high. Cols: tested on low/medium/high. */
export const transferMatrix: readonly (readonly TransferCell[])[] = [
  [
    { successes: 36, trials: 96, rate: 37.5 },
    { successes: 38, trials: 96, rate: 39.58 },
    { successes: 35, trials: 96, rate: 36.46 },
  ],
  [
    { successes: 33, trials: 96, rate: 34.38 },
    { successes: 34, trials: 96, rate: 35.42 },
    { successes: 31, trials: 96, rate: 32.29 },
  ],
  [
    { successes: 33, trials: 96, rate: 34.38 },
    { successes: 32, trials: 96, rate: 33.33 },
    { successes: 29, trials: 96, rate: 30.21 },
  ],
] as const;
