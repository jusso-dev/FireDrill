"use client";
import { Button, Card, ErrorPanel, PageHeader, SectionLabel } from "@/components/ui";
import { postJson } from "@/lib/api";
import { useState } from "react";

const ENDPOINTS: { name: string; url: string; host: string }[] = [
  { name: "Dashboard", url: "http://localhost:3301", host: "this surface" },
  { name: "API health", url: "http://localhost:4000/health", host: "fastify" },
  { name: "API metrics", url: "http://localhost:4000/metrics", host: "prometheus" },
  { name: "Worker metrics", url: "http://localhost:4001/metrics", host: "bullmq" },
  { name: "Prometheus", url: "http://localhost:9090", host: "scrape + alerts" },
  { name: "Grafana", url: "http://localhost:3201", host: "dashboards" },
];

const LIMITS: { label: string; value: string }[] = [
  { label: "memory cap", value: "256 MB" },
  { label: "backlog rate", value: "≤100 jobs/s" },
  { label: "latency cap", value: "5 s" },
  { label: "error rate cap", value: "100%" },
];

export default function SettingsPage() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function resetAll() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await postJson("/api/simulate/reset", {});
      setMsg("All scenarios reset.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Endpoints, safety caps, and lab controls."
      />

      {err && <ErrorPanel title="Action failed" message={err} />}
      {msg && (
        <Card>
          <p className="text-sm text-signal-green font-mono">{msg}</p>
        </Card>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionLabel>Endpoints</SectionLabel>
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {ENDPOINTS.map((e) => (
              <li
                key={e.name}
                className="grid grid-cols-[1fr_auto] items-center gap-3 py-2.5"
              >
                <div>
                  <div className="font-mono text-sm text-bone-100">{e.name}</div>
                  <div className="text-[11px] text-steel-400 mt-0.5">{e.host}</div>
                </div>
                <a
                  href={e.url}
                  className="font-mono text-xs text-ember-500 hover:text-ember-400"
                  target="_blank"
                  rel="noreferrer"
                >
                  open →
                </a>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionLabel>Safety caps</SectionLabel>
          <p className="mt-3 text-sm text-steel-300 leading-relaxed max-w-[60ch]">
            Hard limits that keep the simulator from harming your host.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {LIMITS.map((l) => (
              <div
                key={l.label}
                className="rounded border border-[var(--border)] bg-[var(--bg)] p-3"
              >
                <div className="eyebrow">{l.label}</div>
                <div className="mt-1 font-mono text-sm text-bone-100">{l.value}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <SectionLabel>Controls</SectionLabel>
          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-steel-300 max-w-[60ch]">
              Disable every active scenario in one call. Open incidents stay in
              the log; they're resolved as part of the reset.
            </p>
            <Button variant="ghost" onClick={resetAll} disabled={busy}>
              {busy ? "resetting…" : "reset all scenarios"}
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <SectionLabel>About</SectionLabel>
          <p className="mt-3 text-sm text-bone-200 leading-relaxed max-w-[72ch]">
            FireDrill is a self-hosted SRE incident-simulation lab. Trigger
            realistic failures, watch them surface in metrics, alerts and
            dashboards, then generate a post-incident report. Built as a
            portfolio project — not for production fire.
          </p>
        </Card>
      </section>
    </div>
  );
}
