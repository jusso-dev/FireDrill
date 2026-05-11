import { describe, expect, it } from "vitest";
import { evaluateAlerts } from "../alerts.js";

const base = {
  errorRate: 0,
  p95LatencyMs: 50,
  queueDepth: 0,
  failedJobs: 0,
  databaseHealthy: true,
  activeScenarios: [],
};

describe("evaluateAlerts", () => {
  it("emits nothing when healthy", () => {
    expect(evaluateAlerts(base)).toHaveLength(0);
  });

  it("fires high error rate at 10%", () => {
    const alerts = evaluateAlerts({ ...base, errorRate: 0.1 });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].name).toBe("High error rate");
    expect(alerts[0].severity).toBe("warning");
  });

  it("escalates error rate above 20%", () => {
    const alerts = evaluateAlerts({ ...base, errorRate: 0.25 });
    expect(alerts[0].severity).toBe("critical");
  });

  it("links alert to active scenario", () => {
    const alerts = evaluateAlerts({
      ...base,
      p95LatencyMs: 1200,
      activeScenarios: [{ id: "latency_spike", startedAt: "2026-05-11T00:00:00Z" }],
    });
    expect(alerts[0].scenarioId).toBe("latency_spike");
  });

  it("fires db degraded alert", () => {
    const alerts = evaluateAlerts({ ...base, databaseHealthy: false });
    expect(alerts.find((a) => a.name === "Database degraded")).toBeDefined();
    expect(alerts.find((a) => a.name === "Database degraded")?.severity).toBe("critical");
  });

  it("fires backlog alert with scenario link", () => {
    const alerts = evaluateAlerts({
      ...base,
      queueDepth: 500,
      activeScenarios: [{ id: "queue_backlog", startedAt: "2026-05-11T00:00:00Z" }],
    });
    expect(alerts[0].scenarioId).toBe("queue_backlog");
  });
});
