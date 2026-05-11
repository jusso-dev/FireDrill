"use client";
import { BayTag, Card, CardEyebrow, DispatchLine } from "@/components/ui";

const ENDPOINTS = [
  { name: "Dashboard", url: "http://localhost:3000", host: "this surface" },
  { name: "API", url: "http://localhost:4000/health", host: "fastify" },
  { name: "Prometheus", url: "http://localhost:9090", host: "metrics" },
  { name: "Grafana", url: "http://localhost:3201", host: "dashboards" },
  { name: "Worker /metrics", url: "http://localhost:4001/metrics", host: "bullmq" },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <DispatchLine
        bay="09"
        page="Settings"
        state={<span className="text-steel-300">station configuration</span>}
      />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card rivets>
          <CardEyebrow>Endpoints</CardEyebrow>
          <ul className="mt-4 divide-y divide-concrete-700/60">
            {ENDPOINTS.map((e, i) => (
              <li
                key={e.name}
                className="grid grid-cols-[28px_1fr_auto] items-center gap-3 py-3"
              >
                <span className="bay-tag text-[10px] text-concrete-600">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="font-mono text-sm text-bone-100">{e.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-steel-400">
                    {e.host}
                  </div>
                </div>
                <a
                  href={e.url}
                  className="font-mono text-[11px] text-ember-500 hover:text-ember-400 tracking-wider"
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
          <CardEyebrow>Safety</CardEyebrow>
          <p className="mt-3 text-sm text-bone-200 leading-relaxed max-w-[60ch]">
            Memory pressure simulation is capped at 256 MB. Latency and error
            scenarios apply only to the API process. Reset all scenarios from{" "}
            <a href="/scenarios" className="text-ember-500 hover:text-ember-400 font-mono">
              /scenarios
            </a>
            .
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Limit label="memory cap" value="256 MB" />
            <Limit label="backlog rate" value="≤100 jobs/s" />
            <Limit label="latency cap" value="2 s + 30% jitter" />
            <Limit label="error rate cap" value="100% (capped 100%)" />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardEyebrow>About this station</CardEyebrow>
          <p className="mt-3 text-sm text-bone-200 leading-relaxed max-w-[72ch]">
            FireDrill is a self-hosted SRE incident-simulation lab. Trigger
            realistic failures, watch them surface in metrics, alerts, and
            dashboards, then generate a post-incident report. Built as a
            portfolio project to demonstrate observability and incident
            response, end-to-end, in code you can actually run.
          </p>
          <div className="mt-5 flex items-center gap-4">
            <BayTag bay="STN" />
            <span className="font-mono text-xs text-steel-400 tracking-[0.18em] uppercase">
              Station 24 · drill apparatus · not for production fire
            </span>
          </div>
        </Card>
      </section>
    </div>
  );
}

function Limit({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[2px] border border-concrete-700 bg-concrete-900/80 p-3">
      <div className="dispatch-eyebrow text-concrete-600">{label}</div>
      <div className="mt-1 font-mono text-sm text-bone-100">{value}</div>
    </div>
  );
}
