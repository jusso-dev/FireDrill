import { register } from "./metrics.js";

interface MetricValue {
  value: number;
  labels?: Record<string, string>;
  metricName?: string;
}

interface MetricGroup {
  name: string;
  values: MetricValue[];
}

/**
 * Read counters/histograms back out of the Prom registry as plain JSON,
 * narrowly typed for the snapshot computations below.
 */
async function readGroups(): Promise<MetricGroup[]> {
  return (await register.getMetricsAsJSON()) as unknown as MetricGroup[];
}

interface RequestSummary {
  total: number;
  errors: number;
  errorRate: number;
  p95LatencyMs: number;
}

/**
 * Read p95 from a Prometheus histogram via its cumulative buckets.
 *
 * Buckets come back per-label; we sum across labels because the dashboard
 * shows a single overall p95. The `/metrics` route itself is excluded to
 * avoid biasing the figure toward our own scrape traffic.
 */
function p95FromHistogram(group: MetricGroup | undefined): number {
  if (!group) return 0;
  const buckets = new Map<number, number>();
  let count = 0;
  for (const v of group.values) {
    if (v.labels?.route === "/metrics") continue;
    const name = v.metricName;
    if (!name) continue;
    if (name.endsWith("_bucket")) {
      const le = Number(v.labels?.le);
      if (!Number.isFinite(le)) continue;
      buckets.set(le, (buckets.get(le) ?? 0) + v.value);
    } else if (name.endsWith("_count")) {
      if (v.labels?.route === "/metrics") continue;
      count += v.value;
    }
  }
  if (count === 0 || buckets.size === 0) return 0;
  const target = count * 0.95;
  const sorted = [...buckets.entries()].sort((a, b) => a[0] - b[0]);
  for (const [le, cumulative] of sorted) {
    if (cumulative >= target) return le * 1000;
  }
  return sorted[sorted.length - 1][0] * 1000;
}

export async function requestSummary(): Promise<RequestSummary> {
  const groups = await readGroups();
  const reqs = groups.find((m) => m.name === "firedrill_http_requests_total");
  const dur = groups.find((m) => m.name === "firedrill_http_request_duration_seconds");

  let total = 0;
  let errors = 0;
  for (const v of reqs?.values ?? []) {
    if (v.labels?.route === "/metrics") continue;
    total += v.value;
    if (v.labels?.status?.startsWith("5")) errors += v.value;
  }

  return {
    total,
    errors,
    errorRate: total > 0 ? errors / total : 0,
    p95LatencyMs: p95FromHistogram(dur),
  };
}
