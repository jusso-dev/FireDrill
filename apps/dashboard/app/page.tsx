"use client";
import {
  Badge,
  BayTag,
  Card,
  CardEyebrow,
  DispatchLine,
  MetricTile,
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
  const alarm = (data?.activeIncidents.length ?? 0) > 0 || !!error;

  const stateLine = error
    ? <span className="text-ember-500">apparatus offline</span>
    : !data
    ? <span className="text-steel-400">connecting…</span>
    : alarm
    ? <span className="text-ember-500">alarm condition · {data.activeIncidents.length} live</span>
    : <span className="text-signal-green">all bays green</span>;

  return (
    <div className="space-y-8">
      <DispatchLine
        bay="01"
        page="Overview"
        state={stateLine}
        alarm={alarm && !error}
      />

      {error && (
        <Card alarm className="border-ember-700">
          <CardEyebrow alarm>API unreachable</CardEyebrow>
          <p className="mt-2 text-sm text-ember-400 font-mono">{error}</p>
          <p className="mt-1 text-xs text-steel-400">
            check <code className="text-bone-200">docker compose ps</code>
          </p>
        </Card>
      )}

      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricTile
          bay={11}
          label="Active"
          value={data?.activeIncidents.length ?? "—"}
          hint="open incidents"
          tone={(data?.activeIncidents.length ?? 0) > 0 ? "bad" : "good"}
        />
        <MetricTile
          bay={12}
          label="p95"
          value={data ? `${data.p95LatencyMs.toFixed(0)}` : "—"}
          hint="ms · http"
          tone={data ? tone(data.p95LatencyMs, 200, 1000) : "neutral"}
        />
        <MetricTile
          bay={13}
          label="5xx"
          value={data ? `${(data.errorRate * 100).toFixed(1)}%` : "—"}
          hint="error ratio"
          tone={data ? tone(data.errorRate * 100, 1, 5) : "neutral"}
        />
        <MetricTile
          bay={14}
          label="Requests"
          value={data?.requestRate ?? "—"}
          hint="since boot"
        />
        <MetricTile
          bay={15}
          label="Queue"
          value={data?.queueDepth ?? "—"}
          hint="jobs waiting"
          tone={data ? tone(data.queueDepth, 50, 500) : "neutral"}
        />
        <MetricTile
          bay={16}
          label="Failed"
          value={data?.failedJobs ?? "—"}
          hint="jobs"
          tone={data ? tone(data.failedJobs, 5, 25) : "neutral"}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        <Card rivets>
          <div className="flex items-end justify-between">
            <div>
              <BayTag bay="A" />
              <h3 className="mt-1 text-base font-semibold tracking-tight text-bone-100">
                Apparatus bay
              </h3>
            </div>
            <Link
              href="/services"
              className="dispatch-eyebrow text-steel-400 hover:text-bone-100"
            >
              detail →
            </Link>
          </div>
          <div className="mt-4 divide-y divide-concrete-700/60">
            {(data?.services ?? []).map((s, i) => (
              <div
                key={s.service}
                className="grid grid-cols-[28px_120px_1fr_auto] items-center gap-3 py-3 text-sm"
              >
                <span className="bay-tag text-[10px] text-concrete-600">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-mono tracking-wide text-bone-100">
                  {s.service}
                </span>
                <span className="text-steel-400 text-xs font-mono">
                  {s.detail}
                </span>
                <StatusPill status={s.status} />
              </div>
            ))}
            {(!data || data.services.length === 0) && (
              <div className="py-6 text-steel-400 text-sm font-mono">
                bay roster loading…
              </div>
            )}
          </div>
        </Card>

        <Card alarm={(data?.activeAlerts?.length ?? 0) > 0}>
          <div className="flex items-center justify-between">
            <CardEyebrow alarm={(data?.activeAlerts?.length ?? 0) > 0}>
              Active alerts
            </CardEyebrow>
            <Link
              href="/incidents"
              className="dispatch-eyebrow text-steel-400 hover:text-bone-100"
            >
              log →
            </Link>
          </div>
          {(data?.activeAlerts ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-steel-400 font-mono">
              radio silent.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data?.activeAlerts.map((a: Alert) => (
                <li
                  key={a.id}
                  className="rounded-[2px] bg-concrete-900/80 border border-concrete-700 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm text-bone-100">
                      {a.name}
                    </span>
                    <Badge tone={a.severity === "critical" ? "bad" : "warn"}>
                      {a.severity}
                    </Badge>
                  </div>
                  <div className="text-xs text-steel-400 mt-1 font-mono">
                    {a.message}
                  </div>
                  {a.scenarioId && (
                    <Link
                      href={`/runbooks#${a.scenarioId}`}
                      className="text-[11px] text-ember-500 hover:text-ember-400 font-mono mt-2 inline-block tracking-wide"
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
          <CardEyebrow alarm={(data?.activeIncidents?.length ?? 0) > 0}>
            Live incidents
          </CardEyebrow>
          <IncidentList
            incidents={data?.activeIncidents ?? []}
            empty="quiet on the wire."
          />
        </Card>
        <Card>
          <CardEyebrow>Recent rolls</CardEyebrow>
          <IncidentList
            incidents={data?.recentIncidents ?? []}
            empty="no rolls yet this shift."
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
    return <p className="mt-4 text-sm text-steel-400 font-mono">{empty}</p>;
  }
  return (
    <ul className="mt-3 divide-y divide-concrete-700/60">
      {incidents.map((i) => (
        <li
          key={i.id}
          className="grid grid-cols-[1fr_auto] items-start gap-3 py-3"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/incidents/${i.id}`}
                className="font-mono text-[12.5px] text-bone-100 hover:text-ember-500 truncate"
              >
                {i.id}
              </Link>
              <span className="font-mono text-[10px] text-steel-400 tracking-[0.16em] uppercase">
                {i.scenarioId}
              </span>
            </div>
            <div className="text-xs text-steel-400 mt-1 truncate">
              {i.summary}
            </div>
            <div className="text-[10px] text-concrete-600 mt-1 font-mono tracking-wider uppercase">
              {new Date(i.startedAt).toLocaleString()}
            </div>
          </div>
          {i.status === "open" ? (
            <span className="inline-flex items-center gap-1.5">
              <StatusDot status="down" pulse />
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ember-500">
                live
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <StatusDot status="healthy" />
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-signal-green">
                clear
              </span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
