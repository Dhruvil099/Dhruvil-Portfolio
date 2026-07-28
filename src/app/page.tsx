import Image from "next/image";
import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import { articles } from "@/data/articles";
import { profile } from "@/data/profile";

function SectionHeading({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="scroll-mt-20 font-mono text-xs uppercase tracking-[0.2em] text-ink-3"
    >
      {children}
    </h2>
  );
}

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-5">
      {/* ───────────────── hero ───────────────── */}
      <section className="grid items-center gap-10 py-16 md:grid-cols-[1.4fr_1fr] md:py-24">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue">
            {profile.shortRole}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            {profile.name}
          </h1>
          <p className="mt-3 text-lg text-ink-2">{profile.role}</p>
          <p className="mt-5 max-w-xl leading-relaxed text-ink-2">
            {profile.intro}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/blogs"
              className="rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Read the research
            </Link>
            <a
              href={`mailto:${profile.email}`}
              className="rounded-lg border border-line px-4 py-2 text-sm text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
            >
              Get in touch
            </a>
          </div>
          <ul className="mt-8 space-y-1.5">
            {profile.currently.map((c) => (
              <li key={c} className="flex items-start gap-2 text-sm text-ink-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange" aria-hidden />
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <Image
              src="/art/hero.jpg"
              alt="Illustration of a small robot held by a measuring-tape leash, juggling coins above a glowing tile while a distant delivery door waits"
              width={1200}
              height={1200}
              priority
              className="h-auto w-full"
            />
          </div>
          <p className="mt-2 text-center text-[11px] text-ink-3">
            The leash, the coins, and the door — from the KL study below.
          </p>
        </div>
      </section>

      {/* ───────────────── research ───────────────── */}
      <section className="border-t border-line/70 py-16">
        <div className="flex items-baseline justify-between">
          <SectionHeading id="research">Research &amp; experiments</SectionHeading>
          <Link href="/blogs" className="text-sm text-blue hover:underline">
            All posts →
          </Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {articles.map((a, i) => (
            // Only the lead article runs full width; the rest sit in the grid.
            <ArticleCard key={a.slug} article={a} featured={i === 0} />
          ))}
        </div>
      </section>

      {/* ───────────────── about ───────────────── */}
      <section className="border-t border-line/70 py-16">
        <SectionHeading id="about">About</SectionHeading>
        <div className="mt-8 grid gap-10 md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4 leading-relaxed text-ink-2">
            {profile.about.map((p) => (
              <p key={p.slice(0, 32)}>{p}</p>
            ))}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">Focus areas</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {profile.focus.map((f) => (
                <li
                  key={f}
                  className="rounded-full border border-line px-3 py-1 text-xs text-ink-2"
                >
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────────────── experience ───────────────── */}
      <section className="border-t border-line/70 py-16">
        <SectionHeading id="experience">Experience</SectionHeading>
        <div className="mt-8 space-y-8">
          {profile.experience.map((e) => (
            <div key={e.org} className="grid gap-2 md:grid-cols-[220px_1fr]">
              <div>
                <div className="font-semibold text-ink">{e.org}</div>
                <div className="text-sm text-ink-2">{e.role}</div>
                <div className="mt-0.5 font-mono text-xs text-ink-3">{e.period}</div>
              </div>
              <ul className="space-y-1.5">
                {e.points.map((p) => (
                  <li key={p.slice(0, 32)} className="flex items-start gap-2 text-sm text-ink-2">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-3" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────── projects ───────────────── */}
      <section className="border-t border-line/70 py-16">
        <SectionHeading id="projects">Selected projects</SectionHeading>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {profile.projects.map((p) => {
            const body = (
              <>
                <h3 className="font-semibold text-ink">{p.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{p.blurb}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.tech.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] text-ink-3"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                {p.href ? (
                  <div className="mt-3 text-xs text-blue group-hover:underline">
                    Read the case study →
                  </div>
                ) : null}
              </>
            );
            return p.href ? (
              <Link
                key={p.name}
                href={p.href}
                className="group flex flex-col rounded-xl border border-line bg-surface p-5 transition-colors hover:border-ink-3/60"
              >
                {body}
              </Link>
            ) : (
              <div
                key={p.name}
                className="flex flex-col rounded-xl border border-line bg-surface p-5"
              >
                {body}
              </div>
            );
          })}
        </div>
      </section>

      {/* ───────────────── contact ───────────────── */}
      <section className="border-t border-line/70 py-16">
        <SectionHeading id="contact">Contact</SectionHeading>
        <div className="mt-6 max-w-xl">
          <p className="leading-relaxed text-ink-2">
            The fastest way to reach me is email. I am glad to talk about AI
            safety research, RL and post-training, or collaborations on small
            rigorous experiments.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={`mailto:${profile.email}`}
              className="rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {profile.email}
            </a>
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-line px-4 py-2 text-sm text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
            >
              GitHub
            </a>
            {profile.linkedin ? (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-line px-4 py-2 text-sm text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
              >
                LinkedIn
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
