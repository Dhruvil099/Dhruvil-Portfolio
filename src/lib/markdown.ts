import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";

export type ArticleChunk =
  | { type: "html"; html: string }
  | { type: "component"; name: string };

const MARKER = /^\{\{component:([a-z0-9-]+)\}\}\s*$/;

async function toHtml(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeShiki, { theme: "github-dark-default" })
    .use(rehypeStringify)
    .process(md);
  return String(file);
}

/**
 * Split an article's markdown on `{{component:<name>}}` marker lines and
 * render the markdown segments to HTML (GFM + shiki highlighting).
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
