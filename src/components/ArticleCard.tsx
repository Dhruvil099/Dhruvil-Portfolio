import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/data/articles";

export default function ArticleCard({
  article,
  featured = false,
}: {
  article: Article;
  featured?: boolean;
}) {
  if (article.status === "in-progress") {
    return (
      <div className="flex h-full flex-col justify-between rounded-xl border border-dashed border-line bg-surface/50 p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange/60" />
              <span className="relative inline-flex size-2 rounded-full bg-orange" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
              running now
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-ink-2">
            {article.title}
          </h3>
          <p className="mt-2 text-sm text-ink-3">{article.dek}</p>
        </div>
        <div className="mt-4 text-xs text-ink-3">Write-up coming soon</div>
      </div>
    );
  }

  return (
    <Link
      href={`/blogs/${article.slug}`}
      className={`group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-ink-3/60 ${
        featured ? "md:col-span-2" : ""
      }`}
    >
      {article.cover ? (
        <div className="relative aspect-[16/9] overflow-hidden border-b border-line">
          <Image
            src={article.cover}
            alt={article.coverAlt ?? ""}
            fill
            sizes="(min-width: 768px) 640px, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            priority={featured}
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-5">
        <h3
          className={`font-semibold tracking-tight text-ink group-hover:underline ${
            featured ? "text-2xl" : "text-lg"
          }`}
        >
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-2">
          {article.dek}
        </p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
          {article.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-line px-2 py-0.5 text-[11px] text-ink-3"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
