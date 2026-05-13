"use client";
import {
  Badge,
  Card,
  ErrorPanel,
  PageHeader,
  SectionLabel,
} from "@/components/ui";
import { usePoll } from "@/components/usePoll";
import { useMemo, useState } from "react";

interface LogLine {
  at: string;
  level: string;
  service: string;
  msg: string;
}

type LogsResp = { logs: LogLine[] };

const TONE: Record<string, "bad" | "warn" | "info" | "neutral"> = {
  error: "bad",
  fatal: "bad",
  warn: "warn",
  info: "info",
  debug: "neutral",
  trace: "neutral",
};

const LEVELS = ["all", "error", "warn", "info", "debug"] as const;
type Level = (typeof LEVELS)[number];

export default function LogsPage() {
  const { data, error } = usePoll<LogsResp>("/api/logs?limit=300", 2000);
  const [level, setLevel] = useState<Level>("all");
  const [query, setQuery] = useState("");

  const logs = data?.logs ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((l) => {
      if (level !== "all" && l.level !== level) return false;
      if (q && !l.msg.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [logs, level, query]);

  const errCount = logs.filter((l) => l.level === "error" || l.level === "fatal").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logs"
        subtitle="In-memory ring buffer from the API. For full history use docker compose logs -f."
        alarm={errCount > 0}
        status={
          errCount > 0 ? (
            <span className="text-ember-500">{errCount} error lines</span>
          ) : (
            <span className="text-signal-green">nominal</span>
          )
        }
      />

      {error && <ErrorPanel title="Cannot reach API" message={error} />}

      <Card>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search messages…"
              className="bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-1.5 text-sm font-mono text-bone-100 placeholder-steel-500 focus:outline-none focus:border-ember-700 w-64"
            />
            <div className="inline-flex rounded border border-[var(--border)] overflow-hidden text-xs font-mono">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={
                    "px-2.5 py-1.5 uppercase tracking-wider transition-colors " +
                    (level === l
                      ? "bg-ember-950/60 text-bone-100"
                      : "text-steel-400 hover:bg-concrete-800 hover:text-bone-100")
                  }
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <SectionLabel>{filtered.length} of {logs.length}</SectionLabel>
        </div>

        <div className="mt-4 max-h-[72vh] overflow-y-auto -mx-5">
          <table className="w-full text-xs font-mono">
            <tbody>
              {filtered.map((l, i) => (
                <tr key={i} className="hover:bg-concrete-800/40 transition-colors">
                  <td className="px-5 py-1.5 align-baseline text-steel-400 whitespace-nowrap">
                    {new Date(l.at).toLocaleTimeString()}
                  </td>
                  <td className="px-2 py-1.5 align-baseline">
                    <Badge tone={TONE[l.level] ?? "neutral"}>{l.level}</Badge>
                  </td>
                  <td className="px-2 py-1.5 align-baseline text-steel-400 whitespace-nowrap">
                    {l.service}
                  </td>
                  <td className="px-5 py-1.5 align-baseline text-bone-200 break-words">
                    {l.msg}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-steel-400">
                    {logs.length === 0 ? "stream warming up…" : "no matching lines"}
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
