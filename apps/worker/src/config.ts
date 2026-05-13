/**
 * Centralised env parsing for the worker. Mirrors apps/api/src/config.ts so
 * both services fail fast with a useful message on misconfiguration.
 */

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example to .env or set it explicitly.`,
    );
  }
  return v;
}

function int(name: string, fallback: number, min = 1, max = 65_535): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`Env ${name}=${raw} must be an integer in [${min}, ${max}].`);
  }
  return n;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  logLevel: process.env.LOG_LEVEL ?? "info",
  redisUrl: required("REDIS_URL"),
  metricsPort: int("WORKER_METRICS_PORT", 4001),
  concurrency: int("WORKER_CONCURRENCY", 4, 1, 64),
  /** How often to refresh the queue-depth gauge, ms. */
  depthPollMs: int("WORKER_DEPTH_POLL_MS", 2_000, 250, 60_000),
} as const;

export type Config = typeof config;
