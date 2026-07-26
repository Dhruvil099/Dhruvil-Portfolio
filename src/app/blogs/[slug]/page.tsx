import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleBody from "@/components/ArticleBody";
import { articles, publishedArticles } from "@/data/articles";

export const dynamicParams = false;

export function generateStaticParams() {
  return publishedArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = publishedArticles.find((a) => a.slug === slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.dek,
    openGraph: {
      title: article.title,
      description: article.dek,
      type: "article",
      images: article.socialImage
        ? [article.socialImage]
        : article.cover
          ? [article.cover]
          : undefined,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = publishedArticles.find((a) => a.slug === slug);
  if (!article || !article.file) notFound();

  const md = await fs.readFile(
    path.join(process.cwd(), "content", "articles", article.file),
    "utf8",
  );

  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <Link
        href="/blogs"
        className="font-mono text-xs text-ink-3 hover:text-ink-2"
      >
        ← Blogs
      </Link>
      <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
        {article.title}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-2">{article.dek}</p>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {article.tags.map((t) => (
          <span
            key={t}
            className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-ink-3"
          >
            {t}
          </span>
        ))}
      </div>

      {article.cover ? (
        <div className="mt-8 overflow-hidden rounded-xl border border-line">
          <Image
            src={article.cover}
            alt={article.coverAlt ?? ""}
            width={1600}
            height={900}
            priority
            className="h-auto w-full"
          />
        </div>
      ) : null}

      <div className="mt-10">
        <ArticleBody md={md} />
      </div>

      <div className="mt-14 rounded-xl border border-line bg-surface p-5 text-sm text-ink-2">
        Questions, corrections, or a way to break this? I want to hear it:{" "}
        <a className="text-blue underline" href="mailto:contact.rezinix@gmail.com">
          email me
        </a>
        .{" "}
        {articles.some((a) => a.status === "in-progress")
          ? "Further work is running now; write-ups appear on the "
          : "The rest of the write-ups are on the "}
        <Link href="/blogs" className="text-blue underline">
          blogs page
        </Link>
        .
      </div>
    </article>
  );
}
