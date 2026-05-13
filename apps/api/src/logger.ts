import pino, { type LoggerOptions } from "pino";

/**
 * Standalone logger — does NOT pull in the strict config module. That keeps
 * unit tests (which don't set DATABASE_URL/REDIS_URL) able to import any
 * file that transitively uses the logger.
 */

export interface LogEntry {
  at: string;
  level: string;
  service: string;
  msg: string;
}

const MAX_LOGS = 500;
const buffer: LogEntry[] = [];

function record(level: string, msg: string): void {
  if (!msg) return;
  buffer.push({ at: new Date().toISOString(), level, service: "api", msg });
  if (buffer.length > MAX_LOGS) buffer.shift();
}

/**
 * Extract a string message from pino's variadic call shape:
 *   logger.info("msg")
 *   logger.info({ a: 1 }, "msg")
 *   logger.info({ msg: "msg", a: 1 })
 */
function extractMsg(args: unknown[]): string {
  const [first, second] = args;
  if (typeof first === "string") return first;
  if (typeof second === "string") return second;
  if (first && typeof first === "object" && "msg" in first) {
    const m = (first as { msg: unknown }).msg;
    if (typeof m === "string") return m;
  }
  return "";
}

const options: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "api" },
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true, singleLine: true } },
  hooks: {
    logMethod(args, method, level) {
      const label = pino.levels.labels[level] ?? "info";
      record(label, extractMsg(args));
      return method.apply(this, args as Parameters<typeof method>);
    },
  },
};

export const logger = pino(options);

export function recentLogs(limit = 200): LogEntry[] {
  const n = Math.min(Math.max(1, Math.floor(limit)), MAX_LOGS);
  return buffer.slice(-n).reverse();
}
