import type { FastifyInstance } from "fastify";
import { Queue } from "bullmq";
import { redis } from "../redis.js";
import { getAllScenarios } from "../scenarios.js";
import { listIncidents } from "../incidents.js";
import { evaluateAlerts } from "../alerts.js";
import { register } from "../metrics.js";
import type {
  OverviewSnapshot,
  ServiceHealth,
  ScenarioState,
} from "@firedrill/shared";
import { pool } from "../db.js";

const emailQueue = new Queue("emails", { connection: redis });
const orderQueue = new Queue("orders", { connection: redis });

async function snapshotStats() {
  const metrics = await register.getMetricsAsJSON();
  const httpReq = metrics.find((m) => m.name === "firedrill_http_requests_total");
  let total = 0;
  let errors = 0;
  for (const v of (httpReq as { values?: Array<Record<string, unknown>> } | undefined)?.values ?? []) {
    const labels = v.labels as Record<string, string> | undefined;
    if (!labels || labels.route === "/metrics") continue;
    total += v.value as number;
    if (/^5/.test(labels.status ?? "")) errors += v.value as number;
  }
  const dur = metrics.find((m) => m.name === "firedrill_http_request_duration_seconds");
  let p95 = 0;
  const bucketTotals = new Map<number, number>();
  let countTotal = 0;
  for (const v of (dur as { values?: Array<Record<string, unknown>> } | undefined)?.values ?? []) {
    const name = v.metricName as string | undefined;
    if (!name) continue;
    if (name.endsWith("_bucket")) {
      const le = parseFloat((v.labels as Record<string, string>).le);
      if (!Number.isFinite(le)) continue;
      bucketTotals.set(le, (bucketTotals.get(le) ?? 0) + (v.value as number));
    } else if (name.endsWith("_count")) {
      countTotal += v.value as number;
    }
  }
  if (countTotal > 0 && bucketTotals.size > 0) {
    const target = countTotal * 0.95;
    const sorted = [...bucketTotals.entries()].sort((a, b) => a[0] - b[0]);
    for (const [le, cnt] of sorted) {
      if (cnt >= target) {
        p95 = le * 1000;
        break;
      }
    }
  }
  const errorRate = total > 0 ? errors / total : 0;
  return { total, errors, errorRate, p95LatencyMs: p95 };
}

async function serviceHealth(scenarios: ScenarioState[]): Promise<ServiceHealth[]> {
  const apiSlow = scenarios.find((s) => s.id === "latency_spike" && s.active);
  const apiErr = scenarios.find((s) => s.id === "error_storm" && s.active);
  const apiMem = scenarios.find((s) => s.id === "memory_pressure" && s.active);
  const dbSlow = scenarios.find((s) => s.id === "db_slowdown" && s.active);
  const workerFail = scenarios.find((s) => s.id === "worker_failure" && s.active);
  const backlog = scenarios.find((s) => s.id === "queue_backlog" && s.active);

  let dbOk = true;
  try {
    await pool.query("SELECT 1");
  } catch {
    dbOk = false;
  }

  const out: ServiceHealth[] = [
    {
      service: "api",
      status: apiSlow || apiErr || apiMem ? "degraded" : "healthy",
      detail: [apiSlow && "latency", apiErr && "errors", apiMem && "memory"]
        .filter(Boolean)
        .join(", ") || "ok",
    },
    {
      service: "worker",
      status: workerFail ? "degraded" : "healthy",
      detail: workerFail ? "failures injected" : "ok",
    },
    {
      service: "postgres",
      status: !dbOk ? "down" : dbSlow ? "degraded" : "healthy",
      detail: !dbOk ? "unreachable" : dbSlow ? "slow queries" : "ok",
    },
    {
      service: "redis",
      status: backlog ? "degraded" : "healthy",
      detail: backlog ? "backlog growing" : "ok",
    },
  ];
  return out;
}

export async function overviewRoutes(app: FastifyInstance) {
  app.get("/api/overview", async (): Promise<OverviewSnapshot> => {
    const scenarios = await getAllScenarios();
    const services = await serviceHealth(scenarios);
    const stats = await snapshotStats();
    const [emailCounts, orderCounts] = await Promise.all([
      emailQueue.getJobCounts("wait", "active", "failed", "completed"),
      orderQueue.getJobCounts("wait", "active", "failed", "completed"),
    ]);
    const queueDepth = (emailCounts.wait ?? 0) + (orderCounts.wait ?? 0);
    const failedJobs = (emailCounts.failed ?? 0) + (orderCounts.failed ?? 0);
    const dbOk = services.find((s) => s.service === "postgres")!.status !== "down";

    const [activeIncidentsList, recentIncidents] = await Promise.all([
      listIncidents({ status: "open", limit: 20 }),
      listIncidents({ limit: 15 }),
    ]);

    const alerts = evaluateAlerts({
      errorRate: stats.errorRate,
      p95LatencyMs: stats.p95LatencyMs,
      queueDepth,
      failedJobs,
      databaseHealthy: dbOk,
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
      databaseHealthy: dbOk,
      activeIncidents: activeIncidentsList,
      recentIncidents,
      activeAlerts: alerts,
    };
  });

  app.get("/api/jobs", async () => {
    const [emails, orders] = await Promise.all([
      emailQueue.getJobCounts("wait", "active", "failed", "completed", "delayed"),
      orderQueue.getJobCounts("wait", "active", "failed", "completed", "delayed"),
    ]);
    return {
      queues: [
        { name: "emails", counts: emails },
        { name: "orders", counts: orders },
      ],
    };
  });
}
