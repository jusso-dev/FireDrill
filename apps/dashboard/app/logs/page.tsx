"use client";
import { Badge, Card, CardEyebrow, DispatchLine } from "@/components/ui";
import { usePoll } from "@/components/usePoll";

type LogsResp = {
  logs: { at: string; level: string; service: string; msg: string }[];
};

const TONE: Record<string, "bad" | "warn" | "info" | "neutral"> = {
  error: "bad",
  warn: "warn",
  info: "info",
  debug: "neutral",
};

export default function LogsPage() {
  const { data } = usePoll<LogsResp>("/api/logs?limit=300", 2000);
  const errCount = (data?.logs ?? []).filter((l) => l.level === "error").length;
  return (
    <div className="space-y-8">
      <DispatchLine
        bay="06"
        page="Logs"
        alarm={errCount > 0}
        state={
          errCount > 0 ? (
            <span className="text-ember-500">{errCount} error lines</span>
          ) : (
            <span className="text-signal-green">stream nominal</span>
          )
        }
      />

      <p className="text-sm text-steel-400 max-w-[70ch]">
        Live ring buffer from the API process. For full retention, use{" "}
        <code className="text-bone-100">docker compose logs -f</code>.
      </p>

      <Card>
        <div className="flex items-center justify-between">
          <CardEyebrow>Stream</CardEyebrow>
          <span className="font-mono text-[11px] text-steel-400 tracking-[0.18em] uppercase">
            {data?.logs.length ?? 0} lines
          </span>
        </div>
        <div className="mt-4 max-h-[70vh] overflow-y-auto -mx-5">
          <table className="w-full text-[12px] font-mono">
            <tbody>
              {(data?.logs ?? []).map((l, i) => (
                <tr
                  key={i}
                  className="hover:bg-concrete-800/60 transition-colors"
                >
                  <td className="px-5 py-1.5 align-baseline text-steel-400 whitespace-nowrap">
                    {new Date(l.at).toLocaleTimeString()}
                  </td>
                  <td className="px-2 py-1.5 align-baseline">
                    <Badge tone={TONE[l.level] ?? "neutral"}>{l.level}</Badge>
                  </td>
                  <td className="px-2 py-1.5 align-baseline text-steel-400 whitespace-nowrap">
                    {l.service}
                  </td>
                  <td className="px-5 py-1.5 align-baseline text-bone-200">
                    {l.msg}
                  </td>
                </tr>
              ))}
              {(!data || data.logs.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-steel-400">
                    stream warming up…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
