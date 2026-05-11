import { describe, expect, it } from "vitest";
import { generateReport } from "../reports.js";
import type { Incident } from "@firedrill/shared";

const incident: Incident = {
  id: "inc_abc",
  scenarioId: "latency_spike",
  status: "resolved",
  startedAt: "2026-05-11T10:00:00.000Z",
  endedAt: "2026-05-11T10:08:00.000Z",
  affectedServices: ["api"],
  summary: "test",
  timeline: [
    { at: "2026-05-11T10:00:00.000Z", kind: "incident_started", message: "start" },
    { at: "2026-05-11T10:08:00.000Z", kind: "incident_resolved", message: "end" },
  ],
};

describe("generateReport", () => {
  it("produces a template report", () => {
    const r = generateReport(incident);
    expect(r.incidentId).toBe("inc_abc");
    expect(r.source).toBe("template");
    expect(r.summary).toMatch(/8 minute/);
    expect(r.detectedSymptoms.length).toBeGreaterThan(0);
    expect(r.remediation.length).toBeGreaterThan(0);
    expect(r.prevention.length).toBeGreaterThan(0);
    expect(r.timeline).toHaveLength(2);
  });

  it("handles ongoing incidents", () => {
    const ongoing: Incident = { ...incident, status: "open", endedAt: null };
    const r = generateReport(ongoing);
    expect(r.summary).toMatch(/ongoing/);
  });
});
