"use client";
import { Badge, Card, CardEyebrow, DispatchLine, StatusDot } from "@/components/ui";
import { usePoll } from "@/components/usePoll";
import type { Incident } from "@firedrill/shared";
import Link from "next/link";

export default function IncidentsPage() {
  const { data, error } = usePoll<{ incidents: Incident[] }>(
    "/api/incidents?limit=100",
    2500,
  );

  const openCount = data?.incidents.filter((i) => i.status === "open").length ?? 0;

  return (
    <div className="space-y-8">
      <DispatchLine
        bay="02"
        page="Incidents"
        alarm={openCount > 0}
        state={
          openCount > 0 ? (
            <span className="text-ember-500">{openCount} open</span>
          ) : (
            <span className="text-signal-green">station log clear</span>
          )
        }
      />

      {error && (
        <Card alarm>
          <CardEyebrow alarm>API error</CardEyebrow>
          <p className="mt-2 text-ember-400 text-sm font-mono">{error}</p>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <CardEyebrow>Roll log</CardEyebrow>
          <span className="font-mono text-[11px] text-steel-400 tracking-[0.18em] uppercase">
            {data?.incidents.length ?? 0} entries
          </span>
        </div>
        <div className="mt-4 overflow-x-auto -mx-5">
          <table className="w-full text-sm font-mono border-separate border-spacing-0">
            <thead>
              <tr className="text-left">
                {["ID", "Scenario", "Status", "Started", "Ended", ""].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-2 text-[10px] uppercase tracking-[0.22em] text-steel-400 border-b border-concrete-700 bg-concrete-900/50"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.incidents ?? []).map((i) => (
                <tr
                  key={i.id}
                  className="group hover:bg-concrete-800/60 transition-colors"
                >
                  <td className="px-5 py-3 border-b border-concrete-700/50">
                    <Link
                      href={`/incidents/${i.id}`}
                      className="text-bone-100 group-hover:text-ember-500 transition-colors"
                    >
                      {i.id}
                    </Link>
                  </td>
                  <td className="px-5 py-3 border-b border-concrete-700/50 text-steel-300">
                    {i.scenarioId}
                  </td>
                  <td className="px-5 py-3 border-b border-concrete-700/50">
                    {i.status === "open" ? (
                      <span className="inline-flex items-center gap-2">
                        <StatusDot status="down" pulse />
                        <span className="text-ember-500 text-[10px] tracking-[0.2em] uppercase">
                          live
                        </span>
                      </span>
                    ) : (
                      <Badge tone="good">resolved</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 border-b border-concrete-700/50 text-steel-400 text-xs">
                    {new Date(i.startedAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 border-b border-concrete-700/50 text-steel-400 text-xs">
                    {i.endedAt ? new Date(i.endedAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-5 py-3 border-b border-concrete-700/50">
                    <Link
                      href={`/incidents/${i.id}`}
                      className="font-mono text-[11px] text-ember-500 hover:text-ember-400 tracking-wider"
                    >
                      open →
                    </Link>
                  </td>
                </tr>
              ))}
              {data?.incidents.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-steel-400 text-sm"
                  >
                    log empty. trigger a scenario to fill it.
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
