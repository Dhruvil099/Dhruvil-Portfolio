import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";

export type ArticleChunk =
  | { type: "html"; html: string }
  | { type: "component"; name: string };

const MARKER = /^\{\{component:([a-z0-9-]+)\}\}\s*$/;

async function toHtml(md: string): Promise<string> {
  // allowDangerousHtml: article markdown is authored in this repo only (no
  // user-generated content); it lets tables use `<br>` inside cells.
  // remarkMath + rehypeKatex render `$…$` and `$$…$$` (see the transform in
  // scripts/: source articles may author math as \(…\) / \[…\]).
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    // Defaults: renders HTML + MathML (screen-reader friendly) and marks a bad
    // expression inline instead of throwing, so one typo can't fail the build.
    .use(rehypeKatex)
    .use(rehypeShiki, { theme: "github-dark-default" })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md);
  return String(file);
}

/**
 * Split an article's markdown on `{{component:<name>}}` marker lines and
 * render the markdown segments to HTML (GFM + math + shiki highlighting).
 */
export async function renderArticleChunks(md: string): Promise<ArticleChunk[]> {
  const segments: Array<{ kind: "md"; text: string } | { kind: "comp"; name: string }> = [];
  let buffer: string[] = [];
  for (const line of md.split("\n")) {
    const m = line.match(MARKER);
    if (m) {
      if (buffer.length) segments.push({ kind: "md", text: buffer.join("\n") });
      buffer = [];
      segments.push({ kind: "comp", name: m[1] });
    } else {
      buffer.push(line);
    }
  }
  if (buffer.length) segments.push({ kind: "md", text: buffer.join("\n") });

  return Promise.all(
    segments.map(async (seg): Promise<ArticleChunk> => {
      if (seg.kind === "comp") return { type: "component", name: seg.name };
      return { type: "html", html: await toHtml(seg.text) };
    }),
  );
}
