import pino from "pino";

interface LogEntry {
  at: string;
  level: string;
  service: string;
  msg: string;
}

const logBuffer: LogEntry[] = [];
const MAX_LOGS = 500;

function pushLog(level: string, msg: string) {
  logBuffer.push({ at: new Date().toISOString(), level, service: "api", msg });
  if (logBuffer.length > MAX_LOGS) logBuffer.shift();
}

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "api" },
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true } },
  hooks: {
    logMethod(args, method, level) {
      const label = pino.levels.labels[level] ?? "info";
      const first = args[0];
      let msg = "";
      if (typeof first === "string") {
        msg = first;
      } else if (
        first &&
        typeof first === "object" &&
        "msg" in (first as Record<string, unknown>) &&
        typeof (first as { msg: unknown }).msg === "string"
      ) {
        msg = (first as { msg: string }).msg;
      } else if (typeof args[1] === "string") {
        msg = args[1];
      }
      if (msg) pushLog(label, msg);
      // @ts-expect-error pino hook signature
      return method.apply(this, args);
    },
  },
});

export function recentLogs(limit = 200): LogEntry[] {
  return logBuffer.slice(-limit).reverse();
}
