// ─────────────────────────────────────────────────────────────────────────────
// Research / article registry.
//
// To publish a new article:
//   1. drop `content/articles/<slug>.md` (plain markdown; images under
//      /public; optional interactive cells via a `{{component:<name>}}` line —
//      see src/components/ArticleBody.tsx for the component registry)
//   2. add an entry here with status: "published"
// The two "in-progress" entries below are the currently-running experiments —
// flip them to "published" (and fill file/cover) when their write-ups land.
// ─────────────────────────────────────────────────────────────────────────────

export type Article = {
  slug: string;
  title: string;
  dek: string;
  date: string; // ISO
  readingTime?: string;
  cover?: string;
  coverAlt?: string;
  tags: string[];
  status: "published" | "in-progress";
  file?: string; // filename inside content/articles/
};

export const articles: Article[] = [
  {
    slug: "the-kl-penalty-is-a-leash",
    title: "The KL penalty is a leash, not a conscience",
    dek:
      "I built a toy RLHF loop with a deliberately gameable reward, believed a tidy conclusion, then audited my own experiment. The audit broke the conclusion. What survived is a better safety lesson: task completion can conceal reward exploitation, and how capable your policy is changes what failure looks like.",
    date: "2026-07-26",
    readingTime: "16 min read",
    cover: "/art/cover.jpg",
    coverAlt:
      "Illustration of a delivery robot bouncing on a glowing checkpoint tile amid a fountain of coins while an undelivered package sits beside it and a red delivery door glows far away",
    tags: ["reward hacking", "RLHF", "KL regularization", "6,144 GPU-trained policies"],
    status: "published",
    file: "the-kl-penalty-is-a-leash.md",
  },
  {
    slug: "experiment-02",
    title: "Experiment 02",
    dek: "Currently running. Write-up coming soon.",
    date: "2026-08-01",
    tags: ["in progress"],
    status: "in-progress",
  },
  {
    slug: "experiment-03",
    title: "Experiment 03",
    dek: "Currently running. Write-up coming soon.",
    date: "2026-08-01",
    tags: ["in progress"],
    status: "in-progress",
  },
];

export const publishedArticles = articles.filter((a) => a.status === "published");
