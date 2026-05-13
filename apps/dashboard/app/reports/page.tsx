"use client";
import {
  Button,
  Card,
  ErrorPanel,
  PageHeader,
  SectionLabel,
} from "@/components/ui";
import { usePoll } from "@/components/usePoll";
import { apiFetch } from "@/lib/api";
import type { Incident, IncidentReport } from "@firedrill/shared";
import { useState } from "react";

export default function ReportsPage() {
  const { data, error } = usePoll<{ incidents: Incident[] }>(
    "/api/incidents?limit=50",
    3000,
  );
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load(id: string) {
    setLoadingId(id);
    setLoadError(null);
    try {
      setReport(await apiFetch<IncidentReport>(`/api/incidents/${id}/report`));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingId(null);
    }
  }

  async function copy() {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "could not copy to clipboard");
    }
  }

  const incidents = data?.incidents ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Template-driven post-incident report for any incident."
        status={
          <span className="text-steel-300">
            {incidents.length} incident{incidents.length === 1 ? "" : "s"}
          </span>
        }
      />

      {error && <ErrorPanel title="Cannot reach API" message={error} />}
      {loadError && <ErrorPanel title="Could not load report" message={loadError} />}

      <section className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <Card>
          <SectionLabel>Select incident</SectionLabel>
          <ul className="mt-3 space-y-1 max-h-[64vh] overflow-y-auto -mx-1 px-1">
            {incidents.map((i) => {
              const active = report?.incidentId === i.id || loadingId === i.id;
              return (
                <li key={i.id}>
                  <button
                    onClick={() => load(i.id)}
                    className={
                      "w-full text-left rounded border px-3 py-2 transition-colors " +
                      (active
                        ? "border-ember-700 bg-ember-950/40"
                        : "border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] hover:bg-concrete-800")
                    }
                  >
                    <div className="font-mono text-xs text-bone-100 truncate">{i.id}</div>
                    <div className="text-[10px] font-mono text-steel-400 uppercase tracking-wider mt-0.5">
                      {i.scenarioId} · {i.status}
                    </div>
                  </button>
                </li>
              );
            })}
            {incidents.length === 0 && (
              <li className="text-sm text-steel-400 py-2">
                No incidents yet — trigger a scenario to create one.
              </li>
            )}
          </ul>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <SectionLabel>Post-incident report</SectionLabel>
            {loadingId && (
              <span className="font-mono text-xs text-steel-400">
                drafting {loadingId}…
              </span>
            )}
          </div>
          {!report ? (
            <div className="mt-10 text-center text-steel-400 text-sm">
              Select an incident on the left to generate its report.
            </div>
          ) : (
            <article className="mt-4 space-y-5 max-w-[78ch]">
              <p className="text-sm leading-relaxed text-bone-200">{report.summary}</p>
              <Block title="Detected symptoms" items={report.detectedSymptoms} />
              <div>
                <h4 className="eyebrow">Suspected root cause</h4>
                <p className="mt-2 text-sm text-bone-200">{report.suspectedRootCause}</p>
              </div>
              <Block title="Remediation" items={report.remediation} />
              <Block title="Prevention" items={report.prevention} />
              <Block
                title="Timeline"
                items={report.timeline.map(
                  (t) => `${new Date(t.at).toLocaleTimeString()} · ${t.message}`,
                )}
              />
              <div className="pt-2 flex gap-2">
                <Button variant="ghost" onClick={copy}>
                  {copied ? "copied" : "copy json"}
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
      <h4 className="eyebrow">{title}</h4>
      <ul className="mt-2 space-y-1">
        {items.map((s, i) => (
          <li key={i} className="flex gap-2 text-sm text-bone-200">
            <span className="font-mono text-steel-500 mt-1">·</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
