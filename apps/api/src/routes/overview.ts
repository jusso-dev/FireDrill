import type { FastifyInstance } from "fastify";
import { queues } from "../queues.js";
import { pool } from "../db.js";
import { getAllScenarios } from "../scenarios.js";
import { listIncidents } from "../incidents.js";
import { evaluateAlerts } from "../alerts.js";
import { requestSummary } from "../metrics-summary.js";
import { logger } from "../logger.js";
import type {
  OverviewSnapshot,
  ScenarioState,
  ServiceHealth,
} from "@firedrill/shared";

async function pingDb(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (err) {
    logger.warn({ err: (err as Error).message }, "db ping failed in overview");
    return false;
  }
}

function pickActive(scenarios: ScenarioState[]) {
  const by = (id: ScenarioState["id"]) =>
    Boolean(scenarios.find((s) => s.id === id && s.active));
  return {
    latency: by("latency_spike"),
    errors: by("error_storm"),
    memory: by("memory_pressure"),
    dbSlow: by("db_slowdown"),
    workerFail: by("worker_failure"),
    backlog: by("queue_backlog"),
  };
}

async function serviceHealth(scenarios: ScenarioState[]): Promise<ServiceHealth[]> {
  const active = pickActive(scenarios);
  const dbOk = await pingDb();

  const apiReasons = [active.latency && "latency", active.errors && "errors", active.memory && "memory"]
    .filter(Boolean) as string[];

  return [
    {
      service: "api",
      status: apiReasons.length > 0 ? "degraded" : "healthy",
      detail: apiReasons.length > 0 ? apiReasons.join(", ") : "ok",
    },
    {
      service: "worker",
      status: active.workerFail ? "degraded" : "healthy",
      detail: active.workerFail ? "failures injected" : "ok",
    },
    {
      service: "postgres",
      status: !dbOk ? "down" : active.dbSlow ? "degraded" : "healthy",
      detail: !dbOk ? "unreachable" : active.dbSlow ? "slow queries" : "ok",
    },
    {
      service: "redis",
      status: active.backlog ? "degraded" : "healthy",
      detail: active.backlog ? "backlog growing" : "ok",
    },
  ];
}

export async function overviewRoutes(app: FastifyInstance) {
  app.get("/api/overview", async (): Promise<OverviewSnapshot> => {
    const scenarios = await getAllScenarios();

    const [services, stats, emailCounts, orderCounts, activeIncidentsList, recentIncidents] =
      await Promise.all([
        serviceHealth(scenarios),
        requestSummary(),
        queues.emails.getJobCounts("wait", "active", "failed", "completed"),
        queues.orders.getJobCounts("wait", "active", "failed", "completed"),
        listIncidents({ status: "open", limit: 20 }),
        listIncidents({ limit: 15 }),
      ]);

    const queueDepth = (emailCounts.wait ?? 0) + (orderCounts.wait ?? 0);
    const failedJobs = (emailCounts.failed ?? 0) + (orderCounts.failed ?? 0);
    const databaseHealthy =
      services.find((s) => s.service === "postgres")?.status !== "down";

    const activeAlerts = evaluateAlerts({
      errorRate: stats.errorRate,
      p95LatencyMs: stats.p95LatencyMs,
      queueDepth,
      failedJobs,
      databaseHealthy,
      activeScenarios: scenarios
        .filter((s) => s.active)
        .map((s) => ({ id: s.id, startedAt: s.startedAt })),
    });

    return {
      services,
      requestRate: stats.total,
      errorRate: stats.errorRate,
      p95LatencyMs: stats.p95LatencyMs,
      queueDepth,
      failedJobs,
      databaseHealthy,
      activeIncidents: activeIncidentsList,
      recentIncidents,
      activeAlerts,
    };
  });

  app.get("/api/jobs", async () => {
    const [emails, orders] = await Promise.all([
      queues.emails.getJobCounts("wait", "active", "failed", "completed", "delayed"),
      queues.orders.getJobCounts("wait", "active", "failed", "completed", "delayed"),
    ]);
    return {
      queues: [
        { name: "emails", counts: emails },
        { name: "orders", counts: orders },
      ],
    };
  });
}
