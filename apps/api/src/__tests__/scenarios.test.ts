import { describe, expect, it, beforeEach, vi } from "vitest";

vi.mock("../redis.js", () => {
  const store = new Map<string, string>();
  return {
    redis: {
      get: vi.fn(async (k: string) => store.get(k) ?? null),
      set: vi.fn(async (k: string, v: string) => {
        store.set(k, v);
        return "OK";
      }),
      del: vi.fn(async (k: string) => {
        const had = store.has(k);
        store.delete(k);
        return had ? 1 : 0;
      }),
      __store: store,
    },
  };
});

vi.mock("../metrics.js", () => ({
  setScenarioGauge: vi.fn(),
}));

const mod = await import("../scenarios.js");
const redisMod = await import("../redis.js");

beforeEach(async () => {
  (redisMod.redis as unknown as { __store: Map<string, string> }).__store.clear();
});

describe("scenario state", () => {
  it("defaults to inactive", async () => {
    const s = await mod.getScenario("latency_spike");
    expect(s.active).toBe(false);
    expect(s.intensity).toBeGreaterThan(0);
  });

  it("enable/disable transitions", async () => {
    const enabled = await mod.enableScenario("error_storm", { incidentId: "inc_1" });
    expect(enabled.active).toBe(true);
    expect(enabled.incidentId).toBe("inc_1");
    expect(enabled.startedAt).toBeTypeOf("string");

    const disabled = await mod.disableScenario("error_storm");
    expect(disabled.active).toBe(false);
    expect(disabled.endedAt).toBeTypeOf("string");
  });

  it("resetAll clears all scenarios", async () => {
    await mod.enableScenario("latency_spike", { incidentId: "i" });
    await mod.enableScenario("error_storm", { incidentId: "j" });
    await mod.resetAll();
    const all = await mod.getAllScenarios();
    expect(all.every((s) => !s.active)).toBe(true);
  });

  it("intensityIfActive returns null when off", async () => {
    expect(await mod.intensityIfActive("latency_spike")).toBeNull();
    await mod.enableScenario("latency_spike", { incidentId: "i", intensity: 250 });
    expect(await mod.intensityIfActive("latency_spike")).toBe(250);
  });
});
