import fs from "node:fs";
import path from "node:path";

export const RESUME_PATH = "/resume.pdf";

/**
 * True when `public/resume.pdf` exists.
 *
 * The /resume page and its nav link are both gated on this, so the resume
 * stays hidden until the PDF is ready: drop the file in `public/resume.pdf`,
 * redeploy, and the link appears on its own. Server-side only (build time).
 */
export function hasResume(): boolean {
  return fs.existsSync(path.join(process.cwd(), "public", "resume.pdf"));
}
