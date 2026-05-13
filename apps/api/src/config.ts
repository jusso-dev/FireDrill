/**
 * Centralised environment parsing with friendly failure messages.
 *
 * We surface bad configuration loudly at boot rather than letting downstream
 * libraries fail in obscure ways (e.g. pg trying to dial `undefined`).
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
    throw new Error(
      `Env ${name}=${raw} must be an integer in [${min}, ${max}].`,
    );
  }
  return n;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  logLevel: process.env.LOG_LEVEL ?? "info",
  port: int("API_PORT", 4000),
  databaseUrl: required("DATABASE_URL"),
  redisUrl: required("REDIS_URL"),
  /** Postgres pool size. */
  pgPoolMax: int("PG_POOL_MAX", 10, 1, 200),
  /** Statement timeout in ms (Postgres `statement_timeout`). */
  pgStatementTimeoutMs: int("PG_STATEMENT_TIMEOUT_MS", 10_000, 100, 600_000),
  /** Idle-in-transaction timeout in ms. */
  pgIdleTxTimeoutMs: int("PG_IDLE_TX_TIMEOUT_MS", 10_000, 100, 600_000),
  /** Hard cap on memory-pressure simulation, in MB. */
  memoryPressureCapMb: int("MEMORY_PRESSURE_CAP_MB", 256, 1, 1024),
  /** Hard cap on backlog producer rate, jobs/s. */
  backlogRateCap: int("BACKLOG_RATE_CAP", 100, 1, 10_000),
} as const;

export type Config = typeof config;
