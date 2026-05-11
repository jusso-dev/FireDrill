"use client";
import {
  BayTag,
  Button,
  Card,
  CardEyebrow,
  DispatchLine,
} from "@/components/ui";
import { usePoll } from "@/components/usePoll";
import { apiFetch } from "@/lib/api";
import type { Incident, IncidentReport } from "@firedrill/shared";
import { useState } from "react";

export default function ReportsPage() {
  const { data } = usePoll<{ incidents: Incident[] }>(
    "/api/incidents?limit=50",
    3000,
  );
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function load(id: string) {
    setLoadingId(id);
    try {
      const r = await apiFetch<IncidentReport>(`/api/incidents/${id}/report`);
      setReport(r);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <DispatchLine
        bay="07"
        page="Reports"
        state={
          <span className="text-steel-300">
            {data?.incidents.length ?? 0} roll{(data?.incidents.length ?? 0) === 1 ? "" : "s"} on file
          </span>
        }
      />

      <section className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <Card>
          <CardEyebrow>Pick roll</CardEyebrow>
          <ul className="mt-3 space-y-1 max-h-[64vh] overflow-y-auto -mx-1 px-1">
            {(data?.incidents ?? []).map((i, idx) => {
              const active = report?.incidentId === i.id || loadingId === i.id;
              return (
                <li key={i.id}>
                  <button
                    onClick={() => load(i.id)}
                    className={
                      "w-full text-left rounded-[2px] border px-3 py-2 transition-colors " +
                      (active
                        ? "border-ember-700 bg-ember-950/60"
                        : "border-concrete-700 bg-concrete-900/60 hover:border-concrete-600 hover:bg-concrete-800")
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[12px] text-bone-100 truncate">
                        {i.id}
                      </span>
                      <BayTag bay={(idx % 99) + 1} />
                    </div>
                    <div className="text-[11px] font-mono text-steel-400 uppercase tracking-[0.18em] mt-1">
                      {i.scenarioId}
                    </div>
                  </button>
                </li>
              );
            })}
            {data?.incidents.length === 0 && (
              <li className="text-sm text-steel-400 font-mono py-2">
                no rolls yet.
              </li>
            )}
          </ul>
        </Card>

        <Card rivets>
          <div className="flex items-center justify-between">
            <CardEyebrow>Post-incident report</CardEyebrow>
            {loadingId && (
              <span className="font-mono text-[11px] text-steel-400 tracking-[0.18em] uppercase">
                drafting {loadingId}…
              </span>
            )}
          </div>
          {!report ? (
            <div className="mt-12 text-center text-steel-400 font-mono text-sm">
              select a roll on the left
            </div>
          ) : (
            <article className="mt-4 space-y-5 max-w-[78ch]">
              <p className="text-sm leading-relaxed text-bone-200">
                {report.summary}
              </p>
              <Block title="Detected symptoms" items={report.detectedSymptoms} />
              <div>
                <h4 className="dispatch-eyebrow text-steel-400">
                  Suspected root cause
                </h4>
                <p className="mt-2 text-sm text-bone-200">
                  {report.suspectedRootCause}
                </p>
              </div>
              <Block title="Remediation" items={report.remediation} />
              <Block title="Prevention" items={report.prevention} />
              <Block
                title="Timeline"
                items={report.timeline.map(
                  (t) =>
                    `${new Date(t.at).toLocaleTimeString()} · ${t.message}`,
                )}
              />
              <div className="pt-2 flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      JSON.stringify(report, null, 2),
                    )
                  }
                >
                  copy json
                </Button>
              </div>
            </article>
          )}
        </Card>
      </section>
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="dispatch-eyebrow text-steel-400">{title}</h4>
      <ul className="mt-2 space-y-1">
        {items.map((s, i) => (
          <li key={i} className="flex gap-2 text-sm text-bone-200">
            <span className="font-mono text-concrete-600 mt-1">·</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
