import fs from "node:fs";
import path from "node:path";

/**
 * Finds the resume PDF, if there is one.
 *
 * Looks for `public/resume.pdf` and for any PDF inside `public/resume/`, so
 * the file can keep a descriptive, versioned name. The /resume page and its
 * nav link are both gated on this: no PDF means the route 404s and the link
 * stays hidden. Server-side only (build time).
 */
export function findResume(): { href: string; filename: string } | null {
  const pub = path.join(process.cwd(), "public");

  const flat = path.join(pub, "resume.pdf");
  if (fs.existsSync(flat) && fs.statSync(flat).isFile()) {
    return { href: "/resume.pdf", filename: "resume.pdf" };
  }

  const dir = path.join(pub, "resume");
  if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
    const pdf = fs
      .readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith(".pdf"))
      .sort()
      .pop();
    if (pdf) {
      return { href: `/resume/${encodeURIComponent(pdf)}`, filename: pdf };
    }
  }

  return null;
}

export function hasResume(): boolean {
  return findResume() !== null;
}
