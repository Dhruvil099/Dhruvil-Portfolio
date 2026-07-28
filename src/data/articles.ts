// ─────────────────────────────────────────────────────────────────────────────
// Research / article registry.
//
// To publish a new article:
//   1. drop `content/articles/<slug>.md` (plain markdown; images under
//      /public; optional interactive cells via a `{{component:<name>}}` line —
//      see src/components/ArticleBody.tsx for the component registry)
//   2. add an entry here with status: "published"
// Array order controls display order (newest / flagship first). To tease work
// in flight, add an entry with status: "in-progress" and no file — it renders
// as a "running now" card until its write-up lands.
// ─────────────────────────────────────────────────────────────────────────────

export type Article = {
  slug: string;
  title: string;
  dek: string;
  // Kept as metadata but not displayed anywhere: array order drives ordering.
  date: string; // ISO
  readingTime?: string;
  cover?: string;
  coverAlt?: string;
  socialImage?: string; // optional square/OG variant; falls back to cover
  tags: string[];
  status: "published" | "in-progress";
  file?: string; // filename inside content/articles/
};

export const articles: Article[] = [
  {
    slug: "from-benchmarks-to-barriers",
    title: "From benchmarks to barriers",
    dek:
      "A safety number is not a permission slip. Using my own two studies — one whose headline I had to retract, one that stopped mid-run — I argue that evidence about a model should authorise only the capabilities its evaluated control portfolio can actually support, and set out what a decision-relevant evaluation has to contain.",
    date: "2026-07-27",
    readingTime: "24 min read",
    cover: "/art/b2b-cover.jpg",
    coverAlt:
      "A small robot stands on the last of four brightly lit stepping stones, facing a closed glowing gate; beyond the gate the remaining stones are dark and barely visible",
    socialImage: "/art/b2b-social.jpg",
    tags: [
      "AGI strategy",
      "deployment authority",
      "safety cases",
      "adaptive evaluation",
      "defence in depth",
    ],
    status: "published",
    file: "from-benchmarks-to-barriers.md",
  },
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
    slug: "reasoning-effort-prompt-injection",
    title:
      "No resolved safety effect of reasoning effort under indirect prompt injection",
    dek:
      "A pinned gpt-oss-20b agent, four AgentDojo domains, and one changed system line: at low, medium and high reasoning effort, no completed comparison resolved a safety effect, the attack search chose the same template every time, and the confirmatory transfer run was lost to a persistence flaw in my own runner. Reasoning effort is not yet a security control.",
    date: "2026-07-27",
    readingTime: "12 min read",
    cover: "/art/reasoning-effort-cover.svg",
    coverAlt:
      "Diagram of a tool-using agent whose tool output carries a hidden injected instruction, beside three reasoning-effort dials and three 95% confidence intervals that all cross zero",
    tags: ["prompt injection", "AgentDojo", "gpt-oss-20b", "reasoning effort", "null result"],
    status: "published",
    file: "reasoning-effort-prompt-injection.md",
  },
  {
    slug: "video-steganography-optimization",
    title: "The optimization problem hidden inside video steganography",
    dek:
      "My final-year project: a two-stage system that carries arbitrary files through an ordinary-looking video and back, with filenames and metadata intact. The hard part was not hiding the data. It was realising that placing it into real footage is a clustering and assignment problem.",
    date: "2026-07-28",
    readingTime: "14 min read",
    cover: "/projects/secure-data-transmission/overview-card.jpg",
    coverAlt:
      "Research overview diagram titled Enhancing Secure Data Transmission using Video-Based Steganography with Pixel-Level Embedding, showing Stage I producing a pixelated video and Stage II clustering those pixels into an everyday carrier video",
    tags: ["project case study", "steganography", "Rust", "OpenCV", "clustering", "Hungarian algorithm"],
    status: "published",
    file: "video-steganography-optimization.md",
  },
  {
    slug: "flan-t5-statguide",
    title: "The model wrote 811.618 when the question said 81",
    dek:
      "A fine-tuned flan-t5-large whose only job is reading: it extracts four numbers from a statistics word problem and scipy does the rest. Two builds, three approaches that failed first, a bug that took a month to find because my metric could not see it, and a second module where I moved the numbers out of the model's output entirely.",
    date: "2026-07-29",
    readingTime: "45 min read",
    cover: "/projects/flan-t5-statguide/cover.jpg",
    coverAlt:
      "A robot reads a page of text through a magnifying glass; the few values it finds lift off as glowing tokens and travel into a brass calculating mechanism, which outputs a distribution plot with its tail shaded",
    tags: [
      "project case study",
      "flan-t5",
      "fine-tuning",
      "evaluation",
      "scipy",
      "failure analysis",
    ],
    status: "published",
    file: "flan-t5-statguide.md",
  },
];

export const publishedArticles = articles.filter((a) => a.status === "published");
