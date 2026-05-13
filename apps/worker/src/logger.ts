import pino from "pino";

/**
 * Standalone logger so unit tests (which don't set REDIS_URL) can import any
 * file that transitively uses the logger without booting the strict config.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "worker" },
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true, singleLine: true } },
});
