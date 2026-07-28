import { renderArticleChunks } from "@/lib/markdown";
import MarimoCell from "@/components/marimo/MarimoCell";
import RunLogViewer from "@/components/marimo/RunLogViewer";
import KLDialExplorer from "@/components/marimo/KLDialExplorer";
import EffortCIExplorer from "@/components/marimo/EffortCIExplorer";
import TransferMatrix from "@/components/marimo/TransferMatrix";
import NotebookLink from "@/components/NotebookLink";
import Figure from "@/components/Figure";
import CodeCopyButtons from "@/components/CodeCopyButtons";
import DriveVideo from "@/components/DriveVideo";
import ArtifactModal from "@/components/ArtifactModal";
import HarmChainExplorer from "@/components/figures/HarmChainExplorer";
import CorrelatedFailure from "@/components/figures/CorrelatedFailure";
import { NOTEBOOK_URL as KL_NOTEBOOK_URL } from "@/data/klExperiment";
import { NOTEBOOK_URL as REASONING_NOTEBOOK_URL } from "@/data/reasoningEffort";
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
      return (
        <NotebookLink
          url={REASONING_NOTEBOOK_URL}
          description={
            <>
              The preregistration, runner, audit and every result table in this
              article live in a public marimo notebook. The frozen hashes in the
              reproducibility record identify the exact code and data audited
              here.
            </>
          }
        />
      );
    case "notebook-link-kl":
      return (
        <NotebookLink
          url={KL_NOTEBOOK_URL}
          description={
            <>
              The full corrected study runs in a public marimo notebook: the
              environment, the vectorised trainer, the validation checks, the
              exact dynamic-programming oracle and the frozen-policy
              evaluation. The SHA-256 hashes below identify the exact code and
              raw results audited for this article.
            </>
          }
        />
      );
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
    case "stego-demo":
      return (
        <DriveVideo
          fileId="1BDrCmIqmml9tKsDCvl0nR1WI9F8KiCq6"
          poster="/projects/secure-data-transmission/demo-poster.jpg"
          title="Five-minute pitch demonstration of the complete pipeline"
          caption="Files and metadata in, ZIP packaging, ISG embedding, the advanced encode pass, playback of the public video, reconstruction and recovery."
        />
      );
    case "statguide-demo":
      return (
        <ArtifactModal
          src="/projects/flan-t5-statguide/demo.html"
          poster="/projects/flan-t5-statguide/demo-poster.jpg"
          zoom={0.8}
          title="t&Z-testAI — the served interface"
          note="captured app · no backend"
          caption={
            <>
              The app as it ran: a pasted word problem, the four numbers the
              model extracted, the worked solution scipy produced from them,
              and the plot drawn from its output. The solution types itself out
              the way it did in the product, so give it a moment. There is no
              backend behind it, and the fine-tuned weights no longer exist —
              see &ldquo;Where it actually stands&rdquo;. It is also{" "}
              <a
                href="/projects/flan-t5-statguide/demo.html"
                target="_blank"
                rel="noreferrer"
                className="text-blue underline"
              >
                viewable as its own page
              </a>
              .
            </>
          }
        />
      );
    case "emotisense-demo":
      return (
        <ArtifactModal
          src="/projects/emotisense/simulation.html"
          poster="/projects/emotisense/demo-poster.jpg"
          title="EmotiSense — live capture and timeline"
          note="uses your camera and microphone · nothing leaves the page"
          grantMedia
          caption={
            <>
              The capture interface: start a recording and it plots a per-second
              emotion timeline for the face and the voice, plus the pitch and
              intensity traces the audio model reads. It asks for camera and
              microphone access because it runs on your own webcam feed;
              everything stays in the browser tab and nothing is uploaded or
              stored. The published models are not behind it, so treat the
              labels as a demonstration of the interface rather than of the
              accuracies reported below.
            </>
          }
        />
      );
    default:
      return null;
  }
}

export default async function ArticleBody({ md }: { md: string }) {
  const chunks = await renderArticleChunks(md);
  return (
    <div className="prose-article">
      <CodeCopyButtons />
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
