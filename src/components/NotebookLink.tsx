import { NOTEBOOK_URL } from "@/data/reasoningEffort";

/**
 * Prominent link to the study's public molab notebook. Unlike the KL study's
 * ephemeral sandbox, this notebook is durable, so the article links it
 * directly.
 */
export default function NotebookLink() {
  return (
    <div className="my-8 flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 sm:flex-row sm:items-center">
      <div className="flex-1">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
          live notebook
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
          The preregistration, runner, audit and every result table in this
          article live in a public marimo notebook. The frozen hashes in the
          reproducibility record identify the exact code and data audited here.
        </p>
      </div>
      <a
        href={NOTEBOOK_URL}
        target="_blank"
        rel="noreferrer"
        className="shrink-0 rounded-lg bg-blue px-4 py-2 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Open the live marimo notebook →
      </a>
    </div>
  );
}
