import type { Scenario, ScenarioId } from "./types.js";

interface ScenarioWithBounds extends Scenario {
  /** Inclusive min for intensity. */
  minIntensity: number;
  /** Inclusive max for intensity. */
  maxIntensity: number;
  /** Human-readable unit for intensity (e.g. "ms", "%"). */
  intensityUnit: string;
}

export const SCENARIOS: Record<ScenarioId, ScenarioWithBounds> = {
  latency_spike: {
    id: "latency_spike",
    name: "Latency Spike",
    description: "Inject artificial delay into API responses to drive p95 above SLO.",
    affectedServices: ["api"],
    symptoms: ["High p95 latency", "Slow page loads", "Timeouts on downstream callers"],
    defaultIntensity: 800,
    minIntensity: 0,
    maxIntensity: 5000,
    intensityUnit: "ms",
  },
  error_storm: {
    id: "error_storm",
    name: "Error Storm",
    description: "API randomly returns 500s on a fraction of requests.",
    affectedServices: ["api"],
    symptoms: ["Elevated 5xx rate", "Error logs flood", "User-facing failures"],
    defaultIntensity: 35,
    minIntensity: 0,
    maxIntensity: 100,
    intensityUnit: "%",
  },
  db_slowdown: {
    id: "db_slowdown",
    name: "Database Slowdown",
    description: "Database queries become slow; health check degrades.",
    affectedServices: ["api", "postgres"],
    symptoms: ["Slow DB queries", "Degraded /health", "Latency on data endpoints"],
    defaultIntensity: 1500,
    minIntensity: 0,
    maxIntensity: 5000,
    intensityUnit: "ms",
  },
  queue_backlog: {
    id: "queue_backlog",
    name: "Queue Backlog",
    description: "Producer adds jobs faster than worker drains; queue depth grows.",
    affectedServices: ["worker", "redis"],
    symptoms: ["Growing queue depth", "Delayed job completion", "Worker saturation"],
    defaultIntensity: 25,
    minIntensity: 1,
    maxIntensity: 100,
    intensityUnit: "jobs/s",
  },
  worker_failure: {
    id: "worker_failure",
    name: "Worker Failure",
    description: "Worker intentionally fails a portion of jobs.",
    affectedServices: ["worker"],
    symptoms: ["Failed job count rising", "Dead-letter accumulation", "Job retries"],
    defaultIntensity: 60,
    minIntensity: 0,
    maxIntensity: 100,
    intensityUnit: "%",
  },
  memory_pressure: {
    id: "memory_pressure",
    name: "Memory Pressure",
    description: "API service holds a capped buffer to simulate memory growth (safe).",
    affectedServices: ["api"],
    symptoms: ["RSS rising", "GC churn", "Slower request handling"],
    defaultIntensity: 64,
    minIntensity: 1,
    maxIntensity: 256,
    intensityUnit: "MB",
  },
};

export const SCENARIO_IDS: ScenarioId[] = Object.keys(SCENARIOS) as ScenarioId[];

export function isScenarioId(value: string): value is ScenarioId {
  return value in SCENARIOS;
}

/**
 * Clamp a user-provided intensity to the scenario's allowed range, falling back
 * to the scenario default for non-numeric input. Returns a finite integer.
 */
export function clampIntensity(id: ScenarioId, raw: unknown): number {
  const { minIntensity, maxIntensity, defaultIntensity } = SCENARIOS[id];
  const n =
    typeof raw === "number" && Number.isFinite(raw)
      ? raw
      : typeof raw === "string" && raw.trim() !== "" && Number.isFinite(Number(raw))
        ? Number(raw)
        : defaultIntensity;
  return Math.max(minIntensity, Math.min(maxIntensity, Math.round(n)));
}
