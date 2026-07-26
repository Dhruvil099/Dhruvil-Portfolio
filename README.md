# Dhruvil Shah — portfolio

Personal site: AI-safety research write-ups with marimo-style notebook cells
(read-only code + real archived outputs, interactive explorers over the actual
experiment data), plus profile/experience/projects.

Built with Next.js (App Router) + TypeScript + Tailwind v4. Dark-mode-only by
design. Deploy target: Vercel.

## Editing content

| What | Where |
|---|---|
| Profile, about, experience, projects, links | `src/data/profile.ts` (single source of truth) |
| Article registry (incl. the two in-progress experiment slots) | `src/data/articles.ts` |
| Article bodies | `content/articles/*.md` (plain markdown) |
| Interactive notebook cells | add a `{{component:<name>}}` line in the md; register the component in `src/components/ArticleBody.tsx` |
| Experiment data behind the KL explorer | `src/data/klExperiment.ts` (generated from the archived run's `summary.json`) |
| Archived run log | `src/data/runLog.ts` |

To publish a new experiment: drop `content/articles/<slug>.md`, put its images
under `public/articles/<slug>/`, and flip (or add) its entry in
`src/data/articles.ts` to `status: "published"`.

## Develop

```bash
npm install
npm run dev
```

## Deploy (Vercel)

Import the GitHub repo at vercel.com/new — zero config needed. After the
first deploy, set the real production URL in `metadataBase`
(`src/app/layout.tsx`).
