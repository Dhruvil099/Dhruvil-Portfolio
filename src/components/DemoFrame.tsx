"use client";

import { useEffect, useState } from "react";

/**
 * Click-to-open modal holding a captured UI in a sandboxed iframe.
 *
 * The snapshot is a saved page from the running app, pre-rendered once and
 * shipped with every script stripped, so it is completely inert: no backend,
 * no model, no JavaScript. That lets it run under a bare `sandbox` attribute
 * (scripts disabled entirely), and means it renders identically for everyone
 * rather than depending on a CDN or on the captured app re-booting. It is
 * loaded only when opened, keeping it off the article's initial payload.
 */
export default function DemoFrame({
  src,
  poster,
  title,
  caption,
}: {
  src: string;
  poster?: string;
  title: string;
  caption?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <figure className="my-8 overflow-hidden rounded-xl border border-line bg-surface-2">
        <button
          onClick={() => setOpen(true)}
          className="group relative block w-full cursor-pointer text-left"
          aria-label={`Open the interactive demo: ${title}`}
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-bg">
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={poster}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.01]"
              />
            ) : null}
            <span className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-bg/90 via-transparent to-transparent p-5">
              <span className="rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white shadow-lg">
                Open the interactive demo →
              </span>
            </span>
          </div>
        </button>
        <figcaption className="border-t border-line px-4 py-3 text-[11px] leading-relaxed text-ink-3">
          {caption}
        </figcaption>
      </figure>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-50 flex flex-col bg-black/80 p-2 backdrop-blur-sm sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="mx-auto flex h-full w-full max-w-[1500px] flex-col overflow-hidden rounded-xl border border-line bg-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
              <span className="text-sm text-ink">{title}</span>
              <span className="hidden font-mono text-[10px] uppercase tracking-wider text-ink-3 sm:inline">
                static snapshot · no backend
              </span>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto rounded-md border border-line px-2.5 py-1 text-xs text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
                aria-label="Close the demo"
              >
                Close ✕
              </button>
            </div>
            <iframe
              src={src}
              title={title}
              sandbox=""
              className="h-full w-full flex-1 bg-white"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
