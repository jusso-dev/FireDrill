import type { ScenarioId } from "./types.js";

export interface Runbook {
  scenarioId: ScenarioId;
  title: string;
  symptoms: string[];
  detection: string[];
  immediateMitigation: string[];
  longTermFix: string[];
  usefulCommands: string[];
}

export const RUNBOOKS: Record<ScenarioId, Runbook> = {
  latency_spike: {
    scenarioId: "latency_spike",
    title: "Latency Spike",
    symptoms: ["p95 latency > 500ms", "Customer complaints about slowness", "Timeouts upstream"],
    detection: [
      "Check Grafana 'API p95' panel",
      "Inspect `firedrill_http_request_duration_seconds` histogram",
      "Compare against baseline in last 24h",
    ],
    immediateMitigation: [
      "Disable latency scenario via dashboard",
      "Scale API replicas if real",
      "Failover to read replica if DB-backed",
    ],
    longTermFix: [
      "Add caching at hot endpoints",
      "Profile slow paths with flamegraph",
      "Tune connection pools",
    ],
    usefulCommands: [
      "curl -s http://localhost:4000/metrics | grep http_request_duration",
      "docker compose logs api --tail=200",
    ],
  },
  error_storm: {
    scenarioId: "error_storm",
    title: "Error Storm",
    symptoms: ["5xx rate > 5%", "Error log flood", "Customer-facing failures"],
    detection: [
      "Check error-rate panel",
      "Tail API logs for ERROR entries",
      "Inspect `firedrill_http_requests_total{status=~\"5..\"}`",
    ],
    immediateMitigation: [
      "Disable error_storm scenario",
      "Enable circuit breaker / fallback path",
      "Roll back recent deploy if real incident",
    ],
    longTermFix: [
      "Add input validation",
      "Wrap unsafe paths with proper error handling",
      "Add chaos tests in CI",
    ],
    usefulCommands: [
      "curl -s http://localhost:4000/metrics | grep http_requests_total",
      "docker compose logs api | grep -i error",
    ],
  },
  db_slowdown: {
    scenarioId: "db_slowdown",
    title: "Database Slowdown",
    symptoms: ["DB query times rising", "/health reports degraded", "Latency on data endpoints"],
    detection: [
      "Check `firedrill_db_query_duration_seconds`",
      "Watch `firedrill_database_healthy` gauge",
      "Inspect Postgres pg_stat_activity",
    ],
    immediateMitigation: [
      "Disable db_slowdown scenario",
      "Kill long-running queries",
      "Route reads to replica",
    ],
    longTermFix: [
      "Add proper indexes",
      "Add query budgets and timeouts",
      "Connection pool tuning",
    ],
    usefulCommands: [
      "docker compose exec postgres psql -U firedrill -c 'select pid, state, query from pg_stat_activity;'",
    ],
  },
  queue_backlog: {
    scenarioId: "queue_backlog",
    title: "Queue Backlog",
    symptoms: ["Queue depth growing unbounded", "Job latency rising", "Worker saturated"],
    detection: [
      "Check `firedrill_queue_depth` gauge",
      "Inspect BullMQ waiting count",
      "Watch worker CPU",
    ],
    immediateMitigation: [
      "Disable queue_backlog scenario",
      "Scale workers horizontally",
      "Pause non-essential producers",
    ],
    longTermFix: [
      "Autoscale worker on queue depth",
      "Partition queues by priority",
      "Tune job concurrency",
    ],
    usefulCommands: [
      "docker compose exec redis redis-cli LLEN bull:default:wait",
    ],
  },
  worker_failure: {
    scenarioId: "worker_failure",
    title: "Worker Failure",
    symptoms: ["Failed job count climbing", "Retries exhausted", "Dead-letter growth"],
    detection: [
      "Check `firedrill_jobs_failed_total`",
      "Tail worker logs",
      "Inspect BullMQ failed count",
    ],
    immediateMitigation: [
      "Disable worker_failure scenario",
      "Redrive failed jobs from DLQ",
      "Roll back recent worker deploy",
    ],
    longTermFix: [
      "Add poison-pill detection",
      "Improve idempotency",
      "Add SLO on job success rate",
    ],
    usefulCommands: [
      "docker compose logs worker --tail=200",
    ],
  },
  memory_pressure: {
    scenarioId: "memory_pressure",
    title: "Memory Pressure",
    symptoms: ["Process RSS climbing", "GC pauses", "OOM risk"],
    detection: [
      "Check `process_resident_memory_bytes`",
      "Watch container memory in Grafana",
      "Inspect heap snapshots",
    ],
    immediateMitigation: [
      "Disable memory_pressure scenario",
      "Restart pod / process",
      "Reduce in-memory caches",
    ],
    longTermFix: [
      "Bound caches with LRU + TTL",
      "Add memory-leak regression tests",
      "Set container memory limits",
    ],
    usefulCommands: [
      "docker stats firedrill-api-1",
    ],
  },
};
