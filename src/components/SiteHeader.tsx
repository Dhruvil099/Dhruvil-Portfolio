import Link from "next/link";
import { profile } from "@/data/profile";
import { hasResume } from "@/lib/resume";
import ThemeToggle from "@/components/ThemeToggle";

export default function SiteHeader() {
  // Hidden until public/resume.pdf exists; then it appears automatically.
  const showResume = hasResume();
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
          {showResume ? (
            <Link href="/resume" className="hover:text-ink">
              Resume
            </Link>
          ) : null}
          <Link href="/#contact" className="hover:text-ink">
            Contact
          </Link>
          <a
            href={profile.github}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-line px-2.5 py-1 text-xs hover:border-ink-3 hover:text-ink"
          >
            GitHub
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
