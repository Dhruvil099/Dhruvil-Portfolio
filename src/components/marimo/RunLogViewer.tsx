import { runLog } from "@/data/runLog";

/** Verbatim timestamped log of the archived run, scrollable. */
export default function RunLogViewer() {
  const lines = runLog.split("\n");
  return (
    <div className="max-h-80 overflow-auto rounded-lg border border-line bg-bg/60 p-3 font-mono text-[11px] leading-relaxed">
      {lines.map((line, i) => {
        const sep = line.indexOf(" | ");
        const ts = sep > 0 ? line.slice(0, sep) : "";
        const rest = sep > 0 ? line.slice(sep + 3) : line;
        const strong =
          rest.startsWith("===") ||
          rest.startsWith("START CONDITION") ||
          rest.startsWith("CONDITION COMPLETE") ||
          rest.startsWith("artifacts ready");
        return (
          <div key={i} className="whitespace-pre">
            {ts ? <span className="text-ink-3">{ts} | </span> : null}
            <span className={strong ? "text-blue" : "text-ink-2"}>{rest}</span>
          </div>
        );
      })}
    </div>
  );
}
