"use client";

import { useState } from "react";

/**
 * The seven-link harm pathway from the article's Section 5, with each link's
 * evidence coverage. Content is verbatim from the article's own table — the
 * point of the figure is that the chain goes dark exactly where the evidence
 * stops.
 *
 * Coverage is an ordered 3-level scale, so it uses one sequential hue
 * (light -> dark blue) plus a neutral for "not tested", which is an absence
 * rather than a low value.
 */

type Coverage = "tested" | "partial" | "untested";

const COVERAGE: Record<
  Coverage,
  { label: string; dot: string; ring: string; text: string }
> = {
  tested: {
    label: "evidence bears on this link",
    dot: "var(--series-blue)",
    ring: "border-[var(--series-blue)]",
    text: "text-[var(--effort-high)]",
  },
  partial: {
    label: "only a simplified sandbox version",
    dot: "var(--effort-low)",
    ring: "border-[var(--effort-low)]",
    text: "text-[var(--effort-medium)]",
  },
  untested: {
    label: "not tested by either study",
    dot: "transparent",
    ring: "border-line",
    text: "text-ink-3",
  },
};

const LINKS: {
  n: number;
  name: string;
  mustBeTrue: string;
  bearsOn: string;
  doesNot: string;
  coverage: Coverage;
}[] = [
  {
    n: 1,
    name: "Deployment",
    mustBeTrue: "The system is useful enough to receive tools and autonomy",
    bearsOn: "Clean task performance in a small sandbox",
    doesNot: "Future capability or deployment prevalence",
    coverage: "tested",
  },
  {
    n: 2,
    name: "Misleading objective or context",
    mustBeTrue:
      "A proxy omits intent, or hostile content supplies a conflicting instruction",
    bearsOn: "Both model organisms instantiate one route",
    doesNot: "Frequency in consequential deployments",
    coverage: "tested",
  },
  {
    n: 3,
    name: "Unsafe behaviour",
    mustBeTrue:
      "The policy exploits the proxy or follows the injected objective",
    bearsOn: "Frozen-policy rollouts and simulated environment state",
    doesNot: "Deceptive alignment or persistent internal goals",
    coverage: "tested",
  },
  {
    n: 4,
    name: "Relevant capability",
    mustBeTrue: "The system can plan and invoke the necessary tools",
    bearsOn: "Agent task and tool use",
    doesNot: "Long-horizon competence in frontier systems",
    coverage: "tested",
  },
  {
    n: 5,
    name: "Authority",
    mustBeTrue: "Credentials and permission boundaries allow the action",
    bearsOn: "Only a simplified sandbox version",
    doesNot: "Real least privilege and independent approval",
    coverage: "partial",
  },
  {
    n: 6,
    name: "Failed detection",
    mustBeTrue: "Monitoring does not intervene in time",
    bearsOn: "Not tested; the planned defence stage never started",
    doesNot: "Monitor independence or common blind spots",
    coverage: "untested",
  },
  {
    n: 7,
    name: "Irreversibility and scale",
    mustBeTrue: "Recovery fails, or the event propagates",
    bearsOn: "Not tested",
    doesNot: "Containment, rollback and correlated deployment",
    coverage: "untested",
  },
];

export default function HarmChainExplorer() {
  const [sel, setSel] = useState(5); // link 6 — the first untested link
  const link = LINKS[sel];
  const cov = COVERAGE[link.coverage];

  return (
    <div>
      {/* legend */}
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-2">
        {(Object.keys(COVERAGE) as Coverage[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className={`inline-block size-2.5 rounded-full border ${COVERAGE[k].ring}`}
              style={{ background: COVERAGE[k].dot }}
            />
            {COVERAGE[k].label}
          </span>
        ))}
      </div>

      {/* the chain */}
      <ol className="flex flex-col gap-1.5 sm:flex-row sm:items-stretch">
        {LINKS.map((l, i) => {
          const c = COVERAGE[l.coverage];
          const active = i === sel;
          return (
            <li key={l.n} className="flex flex-1 items-center gap-1.5">
              <button
                onClick={() => setSel(i)}
                aria-pressed={active}
                className={`w-full rounded-lg border px-2 py-2.5 text-left transition-colors sm:min-h-24 ${
                  active
                    ? "border-ink-3 bg-bg"
                    : "border-line bg-bg/40 hover:border-ink-3/60"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className={`inline-block size-2.5 shrink-0 rounded-full border ${c.ring}`}
                    style={{ background: c.dot }}
                  />
                  <span className="font-mono text-[10px] text-ink-3">
                    {l.n}
                  </span>
                </span>
                <span
                  className={`mt-1 block text-[11px] leading-tight ${
                    active ? "text-ink" : "text-ink-2"
                  }`}
                >
                  {l.name}
                </span>
              </button>
              {i < LINKS.length - 1 ? (
                <span
                  aria-hidden
                  className="hidden shrink-0 text-ink-3 sm:inline"
                >
                  ›
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* detail panel */}
      <div className="mt-4 rounded-lg border border-line bg-bg/50 p-4">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-mono text-xs text-ink-3">Link {link.n}</span>
          <span className="text-sm font-medium text-ink">{link.name}</span>
          <span className={`ml-auto text-[11px] ${cov.text}`}>{cov.label}</span>
        </div>
        <dl className="mt-3 space-y-2.5 text-[13px] leading-relaxed">
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-ink-3">
              What must be true
            </dt>
            <dd className="text-ink-2">{link.mustBeTrue}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-ink-3">
              What my evidence bears on
            </dt>
            <dd className="text-ink-2">{link.bearsOn}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-ink-3">
              What it does not establish
            </dt>
            <dd className="text-ink-2">{link.doesNot}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
