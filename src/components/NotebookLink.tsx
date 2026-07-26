/**
 * Prominent link to a study's public molab notebook.
 *
 * Both studies now have durable public notebooks, so each article links its
 * own directly; pass the URL and a one-line description of what the reader
 * will find there.
 */
export default function NotebookLink({
  url,
  description,
}: {
  url: string;
  description: React.ReactNode;
}) {
  return (
    <div className="my-8 flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 sm:flex-row sm:items-center">
      <div className="flex-1">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
          live notebook
        </div>
        {/* div, not p — .prose-article p margins would distort the card */}
        <div className="mt-1.5 text-sm leading-relaxed text-ink-2">
          {description}
        </div>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        // !important utilities: .prose-article a would otherwise repaint this
        // button's label blue and underline it
        className="shrink-0 rounded-lg bg-blue px-4 py-2 text-center text-sm font-medium !text-white !no-underline transition-opacity hover:opacity-90"
      >
        Open the live marimo notebook →
      </a>
    </div>
  );
}
