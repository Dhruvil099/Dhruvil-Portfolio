"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Imported from the package's HTML viewer directly rather than its barrel:
// the barrel also pulls in the React/Vue presets, which import esbuild-wasm
// and @vue/compiler-sfc (undeclared peers we do not need for an HTML
// artifact). Loaded on open so it never ships with the article.
const ArtifactViewer = dynamic(
  () => import("@centralmind/artifacts/dist/esm/viewer/html-viewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-ink-3">
        Loading the demo…
      </div>
    ),
  },
);

/**
 * Runs an artifact (HTML / React / Vue source) in @centralmind/artifacts and
 * shows it in a modal.
 *
 * The viewer renders into a sandboxed iframe but does not expose its iframe
 * attributes, so `grantMedia` reaches in once mounted and adds a Permissions
 * Policy `allow` list plus the `allow-same-origin` token. Both are required
 * before `getUserMedia` will work: a frame with an opaque origin cannot hold
 * camera or microphone permission. Only enable it for artifacts you wrote —
 * `allow-scripts` together with `allow-same-origin` lets the frame reach its
 * own origin, so it is not a boundary against untrusted code.
 */
export default function ArtifactModal({
  files,
  poster,
  title,
  note,
  caption,
  grantMedia = false,
}: {
  files: Record<string, string>;
  poster?: string;
  title: string;
  note?: string;
  caption?: React.ReactNode;
  grantMedia?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Apply capture permissions to the viewer's iframe as soon as it appears.
  useEffect(() => {
    if (!open || !grantMedia || !host.current) return;
    const node = host.current;
    const apply = () => {
      const frame = node.querySelector("iframe");
      if (!frame) return false;
      frame.setAttribute(
        "allow",
        "camera; microphone; display-capture; autoplay; clipboard-write",
      );
      const sandbox = frame.getAttribute("sandbox");
      if (sandbox && !sandbox.includes("allow-same-origin")) {
        frame.setAttribute("sandbox", `${sandbox} allow-same-origin`);
      }
      return true;
    };
    if (apply()) return;
    const obs = new MutationObserver(() => apply() && obs.disconnect());
    obs.observe(node, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [open, grantMedia]);

  return (
    <>
      <figure className="my-8 overflow-hidden rounded-xl border border-line bg-surface-2">
        <button
          onClick={() => setOpen(true)}
          className="group relative block w-full cursor-pointer text-left"
          aria-label={`Open the demo: ${title}`}
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
        {caption ? (
          <figcaption className="border-t border-line px-4 py-3 text-[11px] leading-relaxed text-ink-3">
            {caption}
          </figcaption>
        ) : null}
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
              {note ? (
                <span className="hidden font-mono text-[10px] uppercase tracking-wider text-ink-3 sm:inline">
                  {note}
                </span>
              ) : null}
              <button
                onClick={() => setOpen(false)}
                className="ml-auto rounded-md border border-line px-2.5 py-1 text-xs text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
                aria-label="Close the demo"
              >
                Close ✕
              </button>
            </div>
            <div ref={host} className="min-h-0 flex-1 bg-white [&_iframe]:h-full [&_iframe]:w-full [&>*]:h-full">
              <ArtifactViewer preset={{ kind: "html" }} files={files} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
