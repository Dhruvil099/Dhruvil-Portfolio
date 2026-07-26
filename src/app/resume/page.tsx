import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { profile } from "@/data/profile";
import { hasResume, RESUME_PATH } from "@/lib/resume";

export const metadata: Metadata = {
  title: "Resume",
  description: `Resume of ${profile.name} — ${profile.shortRole}.`,
};

/**
 * Hidden until `public/resume.pdf` exists. Drop the PDF in and redeploy: this
 * page starts resolving and the header link appears on its own.
 */
export default function ResumePage() {
  if (!hasResume()) notFound();

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue">
            Resume
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">
            {profile.name}
          </h1>
          <p className="mt-2 text-ink-2">{profile.role}</p>
        </div>
        <div className="flex gap-3">
          <a
            href={RESUME_PATH}
            download={`${profile.name.replace(/\s+/g, "-")}-Resume.pdf`}
            className="rounded-lg bg-blue px-4 py-2 text-sm font-medium !text-white !no-underline transition-opacity hover:opacity-90"
          >
            Download PDF
          </a>
          <a
            href={RESUME_PATH}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-line px-4 py-2 text-sm text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
          >
            Open in new tab
          </a>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-line bg-surface">
        <object
          data={`${RESUME_PATH}#view=FitH`}
          type="application/pdf"
          className="h-[85vh] w-full"
          aria-label={`Resume of ${profile.name} (PDF preview)`}
        >
          {/* Fallback for browsers without inline PDF rendering (e.g. iOS Safari) */}
          <div className="flex h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-ink-2">
              Your browser cannot preview PDFs inline.
            </p>
            <a
              href={RESUME_PATH}
              className="rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Download the resume instead
            </a>
          </div>
        </object>
      </div>
    </div>
  );
}
