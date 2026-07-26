import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { profile } from "@/data/profile";

export const metadata: Metadata = {
  title: "Resume",
  description: `Resume of ${profile.name} — ${profile.shortRole}.`,
};

// ✏️ To publish your resume: drop the file at `public/resume.pdf` and
// redeploy. This page detects it at build time — no code changes needed.
const RESUME_PATH = "/resume.pdf";

function resumeExists(): boolean {
  return fs.existsSync(path.join(process.cwd(), "public", "resume.pdf"));
}

export default function ResumePage() {
  const available = resumeExists();

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
        {available ? (
          <div className="flex gap-3">
            <a
              href={RESUME_PATH}
              download={`${profile.name.replace(/\s+/g, "-")}-Resume.pdf`}
              className="rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
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
        ) : null}
      </div>

      {available ? (
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
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-line bg-surface/50 p-10 text-center">
          <div className="mx-auto flex max-w-md flex-col items-center gap-4">
            <span className="relative flex size-2.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange/60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-orange" />
            </span>
            <h2 className="text-lg font-semibold text-ink">
              Resume is being polished
            </h2>
            <p className="text-sm leading-relaxed text-ink-2">
              A downloadable PDF will appear here very soon. In the meantime,
              the{" "}
              <Link href="/#experience" className="text-blue underline">
                experience
              </Link>{" "}
              and{" "}
              <Link href="/#projects" className="text-blue underline">
                projects
              </Link>{" "}
              sections cover the essentials, and I am one email away.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <a
                href={`mailto:${profile.email}`}
                className="rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                {profile.email}
              </a>
              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-line px-4 py-2 text-sm text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
