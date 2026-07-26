import { profile } from "@/data/profile";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line/70">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-8 text-xs text-ink-3">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span>
          Experiments run in marimo notebooks; figures and logs are from the
          archived runs.
        </span>
        <a
          href={profile.github}
          target="_blank"
          rel="noreferrer"
          className="ml-auto hover:text-ink-2"
        >
          github.com/Dhruvil099
        </a>
      </div>
    </footer>
  );
}
