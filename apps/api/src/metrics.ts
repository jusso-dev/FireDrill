import client from "prom-client";
import type { ScenarioId } from "@firedrill/shared";
import { SCENARIO_IDS } from "@firedrill/shared";

export const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: "firedrill_api_" });

export const httpRequests = new client.Counter({
  name: "firedrill_http_requests_total",
  help: "HTTP requests, labeled by method/route/status",
  labelNames: ["method", "route", "status"],
  registers: [register],
});

export const httpDuration = new client.Histogram({
  name: "firedrill_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.005, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});

export const dbQueryDuration = new client.Histogram({
  name: "firedrill_db_query_duration_seconds",
  help: "Database query duration in seconds",
  labelNames: ["op"],
  buckets: [0.005, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});

export const databaseHealthy = new client.Gauge({
  name: "firedrill_database_healthy",
  help: "1 if DB healthy, 0 otherwise",
  registers: [register],
});

export const scenarioActive = new client.Gauge({
  name: "firedrill_scenario_active",
  help: "1 if scenario active",
  labelNames: ["scenario"],
  registers: [register],
});

export const memoryBallastBytes = new client.Gauge({
  name: "firedrill_memory_ballast_bytes",
  help: "Approximate bytes held by memory pressure simulation",
  registers: [register],
});

export const activeIncidents = new client.Gauge({
  name: "firedrill_active_incidents",
  help: "Currently active incidents",
  registers: [register],
});

export function initScenarioGauges() {
  for (const id of SCENARIO_IDS) scenarioActive.labels(id).set(0);
}

export function setScenarioGauge(id: ScenarioId, active: boolean) {
  scenarioActive.labels(id).set(active ? 1 : 0);
}
