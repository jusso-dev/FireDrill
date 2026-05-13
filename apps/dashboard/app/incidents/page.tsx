"use client";
import {
  Badge,
  Card,
  ErrorPanel,
  PageHeader,
  SectionLabel,
  StatusDot,
} from "@/components/ui";
import { usePoll } from "@/components/usePoll";
import type { Incident } from "@firedrill/shared";
import Link from "next/link";
import { useMemo, useState } from "react";

type Filter = "all" | "open" | "resolved";

export default function IncidentsPage() {
  const { data, error } = usePoll<{ incidents: Incident[] }>(
    "/api/incidents?limit=100",
    2500,
  );
  const [filter, setFilter] = useState<Filter>("all");

  const incidents = data?.incidents ?? [];
  const openCount = useMemo(
    () => incidents.filter((i) => i.status === "open").length,
    [incidents],
  );
  const filtered = useMemo(
    () => (filter === "all" ? incidents : incidents.filter((i) => i.status === filter)),
    [incidents, filter],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incidents"
        subtitle="Every triggered scenario opens an incident here. Click in to see the timeline."
        alarm={openCount > 0}
        status={
          openCount > 0 ? (
            <span className="text-ember-500">{openCount} open</span>
          ) : (
            <span className="text-signal-green">log clear</span>
          )
        }
      />

      {error && <ErrorPanel title="Cannot reach API" message={error} />}

      <Card>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <SectionLabel>
            {filtered.length} entr{filtered.length === 1 ? "y" : "ies"}
          </SectionLabel>
          <div className="inline-flex rounded border border-[var(--border)] overflow-hidden text-xs font-mono">
            {(["all", "open", "resolved"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={
                  "px-3 py-1.5 uppercase tracking-wider transition-colors " +
                  (filter === f
                    ? "bg-ember-950/60 text-bone-100"
                    : "text-steel-400 hover:bg-concrete-800 hover:text-bone-100")
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 overflow-x-auto -mx-5">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="text-left">
                {["ID", "Scenario", "Status", "Started", "Ended", ""].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-2 text-[10px] uppercase tracking-wider text-steel-400 border-b border-[var(--border)] bg-[var(--bg)]/60 font-mono"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr
                  key={i.id}
                  className="group hover:bg-concrete-800/40 transition-colors"
                >
                  <td className="px-5 py-3 border-b border-[var(--border)]/60 font-mono">
                    <Link
                      href={`/incidents/${i.id}`}
                      className="text-bone-100 group-hover:text-ember-500 transition-colors"
                    >
                      {i.id}
                    </Link>
                  </td>
                  <td className="px-5 py-3 border-b border-[var(--border)]/60 text-steel-300 font-mono text-xs">
                    {i.scenarioId}
                  </td>
                  <td className="px-5 py-3 border-b border-[var(--border)]/60">
                    {i.status === "open" ? (
                      <span className="inline-flex items-center gap-2">
                        <StatusDot status="down" pulse />
                        <span className="text-ember-500 text-[10px] uppercase tracking-wider font-mono">
                          live
                        </span>
                      </span>
                    ) : (
                      <Badge tone="good">resolved</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 border-b border-[var(--border)]/60 text-steel-400 text-xs font-mono">
                    {new Date(i.startedAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 border-b border-[var(--border)]/60 text-steel-400 text-xs font-mono">
                    {i.endedAt ? new Date(i.endedAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-5 py-3 border-b border-[var(--border)]/60">
                    <Link
                      href={`/incidents/${i.id}`}
                      className="font-mono text-xs text-ember-500 hover:text-ember-400"
                    >
                      open →
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-steel-400 text-sm">
                    {filter === "all"
                      ? "No incidents yet — trigger a scenario to fill the log."
                      : `No ${filter} incidents.`}
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
