import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "EmotiSense demo",
  description:
    "The EmotiSense capture interface, running standalone with a simulated backend.",
};

/**
 * The EmotiSense capture interface on its own page rather than in a modal, so
 * it gets the full viewport and a stable URL.
 *
 * The frame needs `allow-same-origin` in its sandbox: without it the document
 * has an opaque origin and getUserMedia fails with SecurityError before any
 * permission prompt appears. That is safe here only because the page is our
 * own first-party file.
 */
export default function EmotiSenseDemoPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="border-b border-line bg-surface px-5 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2">
          <div>
            <h1 className="text-sm font-semibold text-ink">
              EmotiSense — capture interface
            </h1>
            <p className="mt-0.5 text-xs text-ink-3">
              Uses your camera and microphone. The feed stays in this tab:
              nothing is uploaded or stored.
            </p>
          </div>
          <Link
            href="/blogs/emotisense"
            className="ml-auto rounded-md border border-line px-2.5 py-1 text-xs text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
          >
            ← Back to the write-up
          </Link>
        </div>
        <div className="mx-auto mt-3 max-w-6xl rounded-lg border border-orange/40 bg-orange/10 px-3 py-2 text-xs leading-relaxed text-ink-2">
          <strong className="text-ink">The predictions here are simulated.</strong>{" "}
          This is the real interface with a stand-in backend: the emotion labels,
          the timelines and the pie charts are generated in the browser, not
          produced by the trained models. The published CNN and LSTM are not
          running behind this page, so nothing shown is evidence of the
          accuracies reported in the{" "}
          <Link href="/blogs/emotisense" className="text-blue underline">
            write-up
          </Link>
          . The pitch and intensity traces are read from your own microphone.
        </div>
      </div>

      <iframe
        src="/projects/emotisense/simulation.html"
        title="EmotiSense capture interface (simulated backend)"
        sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
        allow="camera; microphone; display-capture; autoplay"
        className="min-h-0 w-full flex-1 border-0 bg-white"
      />
    </div>
  );
}
