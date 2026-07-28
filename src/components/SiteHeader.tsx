import Link from "next/link";
import { profile } from "@/data/profile";
import { findResume } from "@/lib/resume";
import ThemeToggle from "@/components/ThemeToggle";

export default function SiteHeader() {
  // Hidden until a resume PDF exists; links straight to the file so the
  // browser's own PDF viewer opens rather than a wrapper page.
  const resume = findResume();
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-5">
        <Link href="/" className="font-semibold tracking-tight text-ink">
          {profile.name}
        </Link>
        <nav className="ml-auto flex items-center gap-5 text-sm text-ink-2">
          <Link href="/blogs" className="hover:text-ink">
            Blogs
          </Link>
          <Link href="/#about" className="hover:text-ink">
            About
          </Link>
          {resume ? (
            <a
              href={resume.href}
              target="_blank"
              rel="noreferrer"
              className="hover:text-ink"
            >
              Resume
            </a>
          ) : null}
          <Link href="/#contact" className="hover:text-ink">
            Contact
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
