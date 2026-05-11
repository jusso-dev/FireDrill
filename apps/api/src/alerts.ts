import type { Alert } from "@firedrill/shared";

export interface AlertInput {
  errorRate: number;
  p95LatencyMs: number;
  queueDepth: number;
  failedJobs: number;
  databaseHealthy: boolean;
  activeScenarios: { id: string; startedAt: string | null }[];
}

const THRESHOLDS = {
  errorRate: 0.05,
  p95Latency: 500,
  queueDepth: 100,
  failedJobs: 10,
};

export function evaluateAlerts(input: AlertInput): Alert[] {
  const out: Alert[] = [];
  const scenarioBy = (id: string) => input.activeScenarios.find((s) => s.id === id);
  const now = new Date().toISOString();

  if (input.errorRate > THRESHOLDS.errorRate) {
    const scen = scenarioBy("error_storm");
    out.push({
      id: "alert_high_error_rate",
      name: "High error rate",
      severity: input.errorRate > 0.2 ? "critical" : "warning",
      message: `5xx rate ${(input.errorRate * 100).toFixed(1)}% > ${(THRESHOLDS.errorRate * 100).toFixed(0)}%`,
      firingSince: scen?.startedAt ?? now,
      scenarioId: scen ? "error_storm" : null,
    });
  }
  if (input.p95LatencyMs > THRESHOLDS.p95Latency) {
    const scen = scenarioBy("latency_spike") ?? scenarioBy("db_slowdown");
    out.push({
      id: "alert_high_latency",
      name: "High p95 latency",
      severity: input.p95LatencyMs > 2000 ? "critical" : "warning",
      message: `p95 ${input.p95LatencyMs.toFixed(0)}ms > ${THRESHOLDS.p95Latency}ms`,
      firingSince: scen?.startedAt ?? now,
      scenarioId: (scen?.id as Alert["scenarioId"]) ?? null,
    });
  }
  if (input.queueDepth > THRESHOLDS.queueDepth) {
    const scen = scenarioBy("queue_backlog");
    out.push({
      id: "alert_queue_backlog",
      name: "Queue backlog",
      severity: input.queueDepth > 1000 ? "critical" : "warning",
      message: `Queue depth ${input.queueDepth} > ${THRESHOLDS.queueDepth}`,
      firingSince: scen?.startedAt ?? now,
      scenarioId: scen ? "queue_backlog" : null,
    });
  }
  if (input.failedJobs > THRESHOLDS.failedJobs) {
    const scen = scenarioBy("worker_failure");
    out.push({
      id: "alert_worker_failures",
      name: "Worker failures",
      severity: input.failedJobs > 100 ? "critical" : "warning",
      message: `Failed jobs: ${input.failedJobs}`,
      firingSince: scen?.startedAt ?? now,
      scenarioId: scen ? "worker_failure" : null,
    });
  }
  if (!input.databaseHealthy) {
    const scen = scenarioBy("db_slowdown");
    out.push({
      id: "alert_db_degraded",
      name: "Database degraded",
      severity: "critical",
      message: "Database health check failing",
      firingSince: scen?.startedAt ?? now,
      scenarioId: scen ? "db_slowdown" : null,
    });
  }
  return out;
}
