import type { Scenario, ScenarioId } from "./types.js";

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  latency_spike: {
    id: "latency_spike",
    name: "Latency Spike",
    description: "Inject artificial delay into API responses to drive p95 above SLO.",
    affectedServices: ["api"],
    symptoms: ["High p95 latency", "Slow page loads", "Timeouts on downstream callers"],
    defaultIntensity: 800,
  },
  error_storm: {
    id: "error_storm",
    name: "Error Storm",
    description: "API randomly returns 500s on a fraction of requests.",
    affectedServices: ["api"],
    symptoms: ["Elevated 5xx rate", "Error logs flood", "User-facing failures"],
    defaultIntensity: 35,
  },
  db_slowdown: {
    id: "db_slowdown",
    name: "Database Slowdown",
    description: "Database queries become slow; health check degrades.",
    affectedServices: ["api", "postgres"],
    symptoms: ["Slow DB queries", "Degraded /health", "Latency on data endpoints"],
    defaultIntensity: 1500,
  },
  queue_backlog: {
    id: "queue_backlog",
    name: "Queue Backlog",
    description: "Producer adds jobs faster than worker drains; queue depth grows.",
    affectedServices: ["worker", "redis"],
    symptoms: ["Growing queue depth", "Delayed job completion", "Worker saturation"],
    defaultIntensity: 25,
  },
  worker_failure: {
    id: "worker_failure",
    name: "Worker Failure",
    description: "Worker intentionally fails a portion of jobs.",
    affectedServices: ["worker"],
    symptoms: ["Failed job count rising", "Dead-letter accumulation", "Job retries"],
    defaultIntensity: 60,
  },
  memory_pressure: {
    id: "memory_pressure",
    name: "Memory Pressure",
    description: "API service holds a capped buffer to simulate memory growth (safe).",
    affectedServices: ["api"],
    symptoms: ["RSS rising", "GC churn", "Slower request handling"],
    defaultIntensity: 64,
  },
};

export const SCENARIO_IDS: ScenarioId[] = Object.keys(SCENARIOS) as ScenarioId[];

export function isScenarioId(value: string): value is ScenarioId {
  return value in SCENARIOS;
}
