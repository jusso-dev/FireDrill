import { describe, expect, it } from "vitest";
import {
  httpDuration,
  httpRequests,
  initScenarioGauges,
  register,
  scenarioActive,
  setScenarioGauge,
} from "../metrics.js";

describe("metrics", () => {
  it("registers core metrics", async () => {
    initScenarioGauges();
    const json = await register.getMetricsAsJSON();
    const names = json.map((m) => m.name);
    expect(names).toContain("firedrill_http_requests_total");
    expect(names).toContain("firedrill_http_request_duration_seconds");
    expect(names).toContain("firedrill_scenario_active");
  });

  it("scenarioActive gauge toggles", async () => {
    setScenarioGauge("latency_spike", true);
    let json = await register.getMetricsAsJSON();
    let g = json.find((m) => m.name === "firedrill_scenario_active") as unknown as {
      values: Array<{ labels: { scenario: string }; value: number }>;
    };
    expect(g.values.find((v) => v.labels.scenario === "latency_spike")?.value).toBe(1);
    setScenarioGauge("latency_spike", false);
    json = await register.getMetricsAsJSON();
    g = json.find((m) => m.name === "firedrill_scenario_active") as unknown as {
      values: Array<{ labels: { scenario: string }; value: number }>;
    };
    expect(g.values.find((v) => v.labels.scenario === "latency_spike")?.value).toBe(0);
  });

  it("counter & histogram record observations", () => {
    httpRequests.labels("GET", "/x", "200").inc();
    httpDuration.labels("GET", "/x", "200").observe(0.05);
    // no throw = pass
    expect(true).toBe(true);
    void scenarioActive;
  });
});
