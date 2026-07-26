import type { Metadata } from "next";
import ArticleCard from "@/components/ArticleCard";
import { articles } from "@/data/articles";

export const metadata: Metadata = {
  title: "Blogs",
  description:
    "Small, auditable AI-safety experiments — reward hacking, RLHF, evaluations — with figures, logs and corrections published.",
};

export default function ResearchIndex() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue">
        Blog
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">
        Experiments &amp; write-ups
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">
        Every experiment here runs in a marimo notebook with a timestamped log,
        frozen-policy evaluation, and archived raw results. Write-ups keep
        their corrections visible — the audit trail is part of the work.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {articles.map((a) => (
          <ArticleCard key={a.slug} article={a} featured={a.status === "published"} />
        ))}
      </div>
    </div>
  );
}
