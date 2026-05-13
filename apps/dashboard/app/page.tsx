"use client";
import {
  Badge,
  Card,
  ErrorPanel,
  MetricTile,
  PageHeader,
  SectionLabel,
  StatusDot,
  StatusPill,
} from "@/components/ui";
import { usePoll } from "@/components/usePoll";
import type { Alert, Incident, OverviewSnapshot } from "@firedrill/shared";
import Link from "next/link";

function tone(v: number, warn: number, bad: number): "good" | "warn" | "bad" {
  if (v >= bad) return "bad";
  if (v >= warn) return "warn";
  return "good";
}

export default function OverviewPage() {
  const { data, error } = usePoll<OverviewSnapshot>("/api/overview", 2500);
  const liveCount = data?.activeIncidents.length ?? 0;
  const alarm = liveCount > 0;

  const status = error ? (
    <span className="text-ember-500">API unreachable</span>
  ) : !data ? (
    <span className="text-steel-400">loading…</span>
  ) : alarm ? (
    <span className="text-ember-500">{liveCount} live incident{liveCount === 1 ? "" : "s"}</span>
  ) : (
    <span className="text-signal-green">all systems healthy</span>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle="Live health of every FireDrill service, with current alerts and recent incidents."
        status={status}
        alarm={alarm}
      />

      {error && <ErrorPanel title="Cannot reach API" message={error} />}

      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricTile
          label="Active"
          value={data?.activeIncidents.length ?? "—"}
          hint="open incidents"
          tone={liveCount > 0 ? "bad" : "good"}
        />
        <MetricTile
          label="p95"
          value={data ? data.p95LatencyMs.toFixed(0) : "—"}
          hint="ms · http"
          tone={data ? tone(data.p95LatencyMs, 200, 1000) : "neutral"}
        />
        <MetricTile
          label="5xx rate"
          value={data ? `${(data.errorRate * 100).toFixed(1)}%` : "—"}
          hint="error ratio"
          tone={data ? tone(data.errorRate * 100, 1, 5) : "neutral"}
        />
        <MetricTile
          label="Requests"
          value={data?.requestRate ?? "—"}
          hint="since boot"
        />
        <MetricTile
          label="Queue depth"
          value={data?.queueDepth ?? "—"}
          hint="jobs waiting"
          tone={data ? tone(data.queueDepth, 50, 500) : "neutral"}
        />
        <MetricTile
          label="Failed jobs"
          value={data?.failedJobs ?? "—"}
          hint="cumulative"
          tone={data ? tone(data.failedJobs, 5, 25) : "neutral"}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <SectionLabel>Services</SectionLabel>
            <Link
              href="/services"
              className="text-xs text-steel-400 hover:text-bone-100 transition-colors"
            >
              details →
            </Link>
          </div>
          <div className="mt-3 divide-y divide-[var(--border)]">
            {(data?.services ?? []).map((s) => (
              <div
                key={s.service}
                className="grid grid-cols-[140px_1fr_auto] items-center gap-3 py-2.5 text-sm"
              >
                <span className="font-mono text-bone-100">{s.service}</span>
                <span className="text-steel-400 text-xs font-mono truncate">{s.detail}</span>
                <StatusPill status={s.status} />
              </div>
            ))}
            {!data && !error && (
              <div className="py-6 text-steel-400 text-sm">Loading services…</div>
            )}
          </div>
        </Card>

        <Card alarm={(data?.activeAlerts?.length ?? 0) > 0}>
          <div className="flex items-center justify-between">
            <SectionLabel alarm={(data?.activeAlerts?.length ?? 0) > 0}>
              Active alerts
            </SectionLabel>
            <Link
              href="/incidents"
              className="text-xs text-steel-400 hover:text-bone-100 transition-colors"
            >
              log →
            </Link>
          </div>
          {(data?.activeAlerts ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-steel-400">No firing alerts.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data?.activeAlerts.map((a: Alert) => (
                <li
                  key={a.id}
                  className="rounded bg-[var(--bg)] border border-[var(--border)] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm text-bone-100">{a.name}</span>
                    <Badge tone={a.severity === "critical" ? "bad" : "warn"}>
                      {a.severity}
                    </Badge>
                  </div>
                  <div className="text-xs text-steel-400 mt-1 font-mono">{a.message}</div>
                  {a.scenarioId && (
                    <Link
                      href={`/runbooks#${a.scenarioId}`}
                      className="text-xs text-ember-500 hover:text-ember-400 mt-2 inline-block"
                    >
                      open runbook →
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionLabel alarm={(data?.activeIncidents?.length ?? 0) > 0}>
            Live incidents
          </SectionLabel>
          <IncidentList
            incidents={data?.activeIncidents ?? []}
            empty="No incidents in progress."
          />
        </Card>
        <Card>
          <SectionLabel>Recent</SectionLabel>
          <IncidentList
            incidents={data?.recentIncidents ?? []}
            empty="No incidents recorded yet — trigger a scenario to populate."
          />
        </Card>
      </section>
    </div>
  );
}

function IncidentList({
  incidents,
  empty,
}: {
  incidents: Incident[];
  empty: string;
}) {
  if (incidents.length === 0) {
    return <p className="mt-3 text-sm text-steel-400">{empty}</p>;
  }
  return (
    <ul className="mt-3 divide-y divide-[var(--border)]">
      {incidents.map((i) => (
        <li
          key={i.id}
          className="grid grid-cols-[1fr_auto] items-start gap-3 py-2.5"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/incidents/${i.id}`}
                className="font-mono text-xs text-bone-100 hover:text-ember-500 truncate"
              >
                {i.id}
              </Link>
              <span className="font-mono text-[10px] text-steel-400 uppercase tracking-wider">
                {i.scenarioId}
              </span>
            </div>
            <div className="text-xs text-steel-400 mt-1 truncate">{i.summary}</div>
            <div className="text-[10px] text-steel-500 mt-0.5 font-mono">
              {new Date(i.startedAt).toLocaleString()}
            </div>
          </div>
          {i.status === "open" ? (
            <span className="inline-flex items-center gap-1.5">
              <StatusDot status="down" pulse />
              <span className="font-mono text-[10px] uppercase tracking-wider text-ember-500">
                live
              </span>
            </span>
          ) : (
            <Badge tone="good">resolved</Badge>
          )}
        </li>
      ))}
    </ul>
  );
}
