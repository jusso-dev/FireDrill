import client from "prom-client";
import http from "node:http";

export const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: "firedrill_worker_" });

export const jobsProcessed = new client.Counter({
  name: "firedrill_jobs_processed_total",
  help: "Total jobs processed",
  labelNames: ["queue", "name", "status"],
  registers: [register],
});

export const jobDuration = new client.Histogram({
  name: "firedrill_job_duration_seconds",
  help: "Job processing time in seconds",
  labelNames: ["queue", "name"],
  buckets: [0.005, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});

export const jobsFailed = new client.Counter({
  name: "firedrill_jobs_failed_total",
  help: "Total jobs failed",
  labelNames: ["queue", "name"],
  registers: [register],
});

export const queueDepth = new client.Gauge({
  name: "firedrill_queue_depth",
  help: "Queue depth (waiting jobs)",
  labelNames: ["queue"],
  registers: [register],
});

export function startMetricsServer(port: number) {
  const server = http.createServer(async (req, res) => {
    if (req.url === "/metrics") {
      res.setHeader("Content-Type", register.contentType);
      res.end(await register.metrics());
      return;
    }
    if (req.url === "/health") {
      res.end("ok");
      return;
    }
    res.statusCode = 404;
    res.end();
  });
  server.listen(port);
  return server;
}
