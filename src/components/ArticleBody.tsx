import { renderArticleChunks } from "@/lib/markdown";
import MarimoCell from "@/components/marimo/MarimoCell";
import RunLogViewer from "@/components/marimo/RunLogViewer";
import KLDialExplorer from "@/components/marimo/KLDialExplorer";
import EffortCIExplorer from "@/components/marimo/EffortCIExplorer";
import TransferMatrix from "@/components/marimo/TransferMatrix";
import NotebookLink from "@/components/NotebookLink";
import Figure from "@/components/Figure";
import HarmChainExplorer from "@/components/figures/HarmChainExplorer";
import CorrelatedFailure from "@/components/figures/CorrelatedFailure";
import {
  trainingRunSnippet,
  summarySnippet,
  effortContrastSnippet,
  effortConditionSnippet,
} from "@/data/marimoSnippets";

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
    case "notebook-link":
      return <NotebookLink />;
    case "effort-ci-explorer":
      return (
        <MarimoCell
          cellName="clustered_contrast"
          code={effortContrastSnippet}
          outputNote="interactive — raw counts and task-clustered 95% CIs, no code execution"
        >
          <EffortCIExplorer />
        </MarimoCell>
      );
    case "transfer-matrix":
      return (
        <MarimoCell
          cellName="evaluation_engine"
          code={effortConditionSnippet}
          outputNote="exploratory pilot — every source effort selected the same template"
        >
          <TransferMatrix />
        </MarimoCell>
      );
    case "harm-chain":
      return (
        <Figure
          label="Figure"
          title="Where the evidence stops along the harm pathway"
          caption={
            <>
              Coverage labels are taken from the article&apos;s own table. Links 6
              and 7 are unshaded because neither study tested them: the planned
              defence stage never started, and containment and recovery were
              out of scope. A benchmark score informs the whole decision only
              through the link it measures.
            </>
          }
        >
          <HarmChainExplorer />
        </Figure>
      );
    case "correlated-failure":
      return (
        <Figure
          label="Figure"
          title="Defence in depth depends on an assumption you have to test"
          caption={
            <>
              Illustrative arithmetic for the article&apos;s hypothetical two
              layers, not measured data from either study. Neither experiment
              estimated a real correlation between actor and monitor failures —
              establishing it is exactly what the proposed portfolio experiment
              is for.
            </>
          }
        >
          <CorrelatedFailure />
        </Figure>
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
