import Link from "next/link";

/**
 * Article figure that sends the reader to a demo on its own page, rather than
 * opening one in a modal. Use when the demo wants the whole viewport or needs
 * a URL of its own (device permissions, sharing, deep links).
 */
export default function DemoPageCard({
  href,
  poster,
  title,
  cta = "Open the demo",
  caption,
}: {
  href: string;
  poster?: string;
  title: string;
  cta?: string;
  caption?: React.ReactNode;
}) {
  return (
    <figure className="my-8 overflow-hidden rounded-xl border border-line bg-surface-2">
      <Link
        href={href}
        className="group relative block w-full"
        aria-label={`${cta}: ${title}`}
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
            <span className="rounded-lg bg-blue px-4 py-2 text-sm font-medium !text-white !no-underline shadow-lg">
              {cta} →
            </span>
          </span>
        </div>
      </Link>
      {caption ? (
        <figcaption className="border-t border-line px-4 py-3 text-[11px] leading-relaxed text-ink-3">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
