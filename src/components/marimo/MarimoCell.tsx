import { codeToHtml } from "shiki";

/**
 * A marimo-notebook cell, presented read-only: real code from the study's
 * notebook on top, its (pre-computed or interactive) output below.
 * Nothing here executes Python — outputs are rendered from the archived run.
 */
export default async function MarimoCell({
  cellName,
  code,
  outputNote,
  children,
}: {
  cellName: string;
  code: string;
  outputNote?: string;
  children: React.ReactNode;
}) {
  const html = await codeToHtml(code, {
    lang: "python",
    theme: "github-dark-default",
  });

  return (
    <figure className="my-8 overflow-hidden rounded-xl border border-line bg-surface-2">
      <figcaption className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-[#e66767]/70" />
          <span className="size-2.5 rounded-full bg-[#c98500]/70" />
          <span className="size-2.5 rounded-full bg-[#199e70]/70" />
        </span>
        <span className="ml-1 font-mono text-xs text-ink-3">
          notebook.py · {cellName}
        </span>
        <span className="ml-auto rounded-full border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-3">
          read-only
        </span>
      </figcaption>

      <div className="marimo-code" dangerouslySetInnerHTML={{ __html: html }} />

      <div className="border-t border-dashed border-line">
        <div className="flex items-center gap-2 px-4 pt-3 font-mono text-[10px] uppercase tracking-wider text-ink-3">
          <span aria-hidden>▸</span> output
          {outputNote ? <span className="normal-case tracking-normal">— {outputNote}</span> : null}
        </div>
        <div className="p-4">{children}</div>
      </div>
    </figure>
  );
}
