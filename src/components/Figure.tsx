/**
 * A plain interactive figure inside an article.
 *
 * Deliberately NOT the `MarimoCell` chrome: that component shows verbatim code
 * from a real notebook, and using it for a figure with no backing notebook
 * would imply provenance that doesn't exist. Use MarimoCell when there is a
 * notebook cell; use Figure for diagrams and derived views.
 */
export default function Figure({
  label,
  title,
  caption,
  children,
}: {
  label: string;
  title: string;
  caption?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <figure className="my-8 overflow-hidden rounded-xl border border-line bg-surface-2">
      <figcaption className="border-b border-line px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
          {label}
        </span>
        <span className="ml-2 text-sm text-ink">{title}</span>
      </figcaption>
      <div className="p-4">{children}</div>
      {caption ? (
        <div className="border-t border-dashed border-line px-4 py-3 text-[11px] leading-relaxed text-ink-3">
          {caption}
        </div>
      ) : null}
    </figure>
  );
}
