"use client";

import { useSyncExternalStore } from "react";

type Choice = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

// Tiny external store: the source of truth is localStorage + the data-theme
// stamp, so the toggle stays in sync with the inline script in layout.tsx and
// with other tabs. Using useSyncExternalStore (rather than useState in an
// effect) keeps the server snapshot explicit and avoids a hydration mismatch.
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): Choice {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function getServerSnapshot(): Choice {
  return "system";
}

function apply(choice: Choice) {
  const root = document.documentElement;
  try {
    if (choice === "system") {
      root.removeAttribute("data-theme");
      localStorage.removeItem(STORAGE_KEY);
    } else {
      root.dataset.theme = choice;
      localStorage.setItem(STORAGE_KEY, choice);
    }
  } catch {
    /* private mode: the stamp still applies for this page view */
    if (choice === "system") root.removeAttribute("data-theme");
    else root.dataset.theme = choice;
  }
  listeners.forEach((l) => l());
}

const NEXT: Record<Choice, Choice> = {
  light: "dark",
  dark: "system",
  system: "light",
};
const LABEL: Record<Choice, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

/** Cycles light → dark → system; "system" hands control back to the OS. */
export default function ThemeToggle() {
  const choice = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <button
      type="button"
      onClick={() => apply(NEXT[choice])}
      aria-label={`Theme: ${LABEL[choice]}. Switch to ${LABEL[NEXT[choice]]}.`}
      title={`Theme: ${LABEL[choice]}`}
      className="flex size-8 items-center justify-center rounded-md border border-line text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
    >
      {/* Both icons are drawn; CSS shows the one matching the active theme. */}
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <g className="hidden dark:block">
          <circle cx="12" cy="12" r="4.2" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
          </g>
        </g>
        <path
          className="block dark:hidden"
          d="M20 14.2A8.2 8.2 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2Z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}
