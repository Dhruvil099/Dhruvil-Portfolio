import { renderArticleChunks } from "@/lib/markdown";
import MarimoCell from "@/components/marimo/MarimoCell";
import RunLogViewer from "@/components/marimo/RunLogViewer";
import KLDialExplorer from "@/components/marimo/KLDialExplorer";
import { trainingRunSnippet, summarySnippet } from "@/data/marimoSnippets";

/**
 * Interactive-cell registry. An article opts in with a `{{component:<name>}}`
 * line in its markdown; unknown names are ignored (renders nothing) so drafts
 * can't break the build.
 */
function InteractiveCell({ name }: { name: string }) {
  switch (name) {
    case "run-log":
      return (
        <MarimoCell
          cellName="training_run"
          code={trainingRunSnippet}
          outputNote="verbatim run.log from the archived GPU run (sha256 37804846…)"
        >
          <RunLogViewer />
        </MarimoCell>
      );
    case "kl-dial-explorer":
      return (
        <MarimoCell
          cellName="summary_table"
          code={summarySnippet}
          outputNote="interactive — real frozen-evaluation data, no code execution"
        >
          <KLDialExplorer />
        </MarimoCell>
      );
    default:
      return null;
  }
}

export default async function ArticleBody({ md }: { md: string }) {
  const chunks = await renderArticleChunks(md);
  return (
    <div className="prose-article">
      {chunks.map((chunk, i) =>
        chunk.type === "html" ? (
          <div key={i} dangerouslySetInnerHTML={{ __html: chunk.html }} />
        ) : (
          <InteractiveCell key={i} name={chunk.name} />
        ),
      )}
    </div>
  );
}
