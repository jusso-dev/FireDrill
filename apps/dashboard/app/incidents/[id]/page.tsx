"use client";
import {
  Badge,
  BayTag,
  Button,
  Card,
  CardEyebrow,
  DispatchLine,
  StatusDot,
} from "@/components/ui";
import { apiFetch, postJson } from "@/lib/api";
import type { Incident, IncidentReport } from "@firedrill/shared";
import { use, useEffect, useState } from "react";
import Link from "next/link";

export default function IncidentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const i = await apiFetch<Incident>(`/api/incidents/${id}`);
      setIncident(i);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function resolve() {
    setBusy(true);
    try {
      await postJson(`/api/incidents/${id}/resolve`, {});
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  async function genReport() {
    setBusy(true);
    try {
      const r = await apiFetch<IncidentReport>(`/api/incidents/${id}/report`);
      setReport(r);
    } finally {
      setBusy(false);
    }
  }

  const open = incident?.status === "open";

  return (
    <div className="space-y-8">
      <DispatchLine
        bay="02"
        page={`Incident ${id}`}
        alarm={open}
        state={
          open ? (
            <span className="text-ember-500">live</span>
          ) : incident ? (
            <span className="text-signal-green">resolved</span>
          ) : (
            <span className="text-steel-400">loading…</span>
          )
        }
      />

      {error && (
        <Card alarm>
          <p className="text-ember-400 text-sm font-mono">{error}</p>
        </Card>
      )}

      {incident && (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {open ? (
                <Badge tone="bad">
                  <StatusDot status="down" pulse />
                  open
                </Badge>
              ) : (
                <Badge tone="good">resolved</Badge>
              )}
              <Link
                href={`/runbooks#${incident.scenarioId}`}
                className="dispatch-eyebrow text-ember-500 hover:text-ember-400"
              >
                runbook · {incident.scenarioId} →
              </Link>
            </div>
            <div className="flex gap-2">
              {open && (
                <Button variant="danger" onClick={resolve} disabled={busy}>
                  resolve
                </Button>
              )}
              <Button variant="alarm" onClick={genReport} disabled={busy}>
                generate report
              </Button>
            </div>
          </div>

          <Card alarm={open} rivets>
            <CardEyebrow alarm={open}>Summary</CardEyebrow>
            <p className="mt-3 text-sm leading-relaxed text-bone-200 max-w-[70ch]">
              {incident.summary}
            </p>
            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
              <Meta label="scenario">{incident.scenarioId}</Meta>
              <Meta label="started">
                {new Date(incident.startedAt).toLocaleString()}
              </Meta>
              <Meta label="ended">
                {incident.endedAt
                  ? new Date(incident.endedAt).toLocaleString()
                  : "—"}
              </Meta>
              <Meta label="affects">
                {incident.affectedServices.join(" · ")}
              </Meta>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <CardEyebrow>Timeline</CardEyebrow>
              <BayTag bay="T" />
            </div>
            <ol className="mt-5 relative pl-8">
              <span
                aria-hidden
                className="absolute left-[10px] top-2 bottom-2 w-px bg-concrete-700"
              />
              {incident.timeline.map((e, idx) => (
                <li key={idx} className="relative pb-5 last:pb-0">
                  <span
                    aria-hidden
                    className={
                      "absolute -left-[2px] top-1.5 h-2 w-2 rounded-full " +
                      (e.kind === "incident_resolved"
                        ? "bg-signal-green"
                        : "bg-ember-500 shadow-[0_0_8px_oklch(0.64_0.21_38/0.7)]")
                    }
                  />
                  <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-steel-400">
                    {new Date(e.at).toLocaleTimeString()} · {e.kind}
                  </div>
                  <div className="text-sm text-bone-200 mt-1">{e.message}</div>
                </li>
              ))}
            </ol>
          </Card>
        </>
      )}

      {report && (
        <Card rivets>
          <div className="flex items-center justify-between">
            <CardEyebrow>Post-incident report</CardEyebrow>
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-steel-400">
              {report.source}
            </span>
          </div>
          <div className="mt-4 space-y-5 max-w-[78ch]">
            <p className="text-sm leading-relaxed text-bone-200">
              {report.summary}
            </p>
            <Section title="Detected symptoms" items={report.detectedSymptoms} />
            <div>
              <h4 className="dispatch-eyebrow text-steel-400">
                Suspected root cause
              </h4>
              <p className="text-sm text-bone-200 mt-2">
                {report.suspectedRootCause}
              </p>
            </div>
            <Section title="Remediation" items={report.remediation} />
            <Section title="Prevention" items={report.prevention} />
          </div>
        </Card>
      )}
    </div>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="dispatch-eyebrow text-concrete-600">{label}</div>
      <div className="mt-1 text-bone-100 font-mono text-sm">{children}</div>
    </div>
  );
}
function Section({ title, items }: { title: string; items: string[] }) {
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
