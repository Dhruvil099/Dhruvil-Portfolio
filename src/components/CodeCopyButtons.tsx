"use client";

import { useEffect } from "react";

/**
 * Adds a copy-to-clipboard button to the top-right of every code block.
 *
 * The article body is server-rendered HTML from markdown, so the buttons are
 * attached on mount rather than emitted by the pipeline. That keeps the
 * markdown plain and means every article gets this for free.
 */
export default function CodeCopyButtons() {
  useEffect(() => {
    const blocks = document.querySelectorAll<HTMLPreElement>(
      ".prose-article pre, .marimo-code pre",
    );

    const cleanups: Array<() => void> = [];

    blocks.forEach((pre) => {
      if (pre.dataset.copyReady) return;
      pre.dataset.copyReady = "1";
      if (getComputedStyle(pre).position === "static") {
        pre.style.position = "relative";
      }

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "code-copy";
      btn.setAttribute("aria-label", "Copy code to clipboard");
      btn.title = "Copy";

      const COPY_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>`;
      const DONE_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;
      btn.innerHTML = COPY_ICON;

      let timer: ReturnType<typeof setTimeout> | undefined;
      const onClick = async () => {
        const code = pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
        try {
          await navigator.clipboard.writeText(code.replace(/\n$/, ""));
        } catch {
          // Older browsers / insecure origins: fall back to a temp selection.
          const ta = document.createElement("textarea");
          ta.value = code;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand("copy");
          } catch {
            /* give up quietly; the code is still selectable by hand */
          }
          document.body.removeChild(ta);
        }
        btn.innerHTML = DONE_ICON;
        btn.classList.add("is-copied");
        btn.title = "Copied";
        clearTimeout(timer);
        timer = setTimeout(() => {
          btn.innerHTML = COPY_ICON;
          btn.classList.remove("is-copied");
          btn.title = "Copy";
        }, 1600);
      };

      btn.addEventListener("click", onClick);
      pre.appendChild(btn);
      cleanups.push(() => {
        clearTimeout(timer);
        btn.removeEventListener("click", onClick);
        btn.remove();
        delete pre.dataset.copyReady;
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
