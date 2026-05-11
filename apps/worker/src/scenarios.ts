import { redis } from "./redis.js";
import type { ScenarioId, ScenarioState } from "@firedrill/shared";

const KEY = (id: ScenarioId) => `firedrill:scenario:${id}`;

export async function readScenario(id: ScenarioId): Promise<ScenarioState | null> {
  const raw = await redis.get(KEY(id));
  return raw ? (JSON.parse(raw) as ScenarioState) : null;
}

export async function shouldFail(id: ScenarioId): Promise<{ fail: boolean; pct: number }> {
  const s = await readScenario(id);
  if (!s?.active) return { fail: false, pct: 0 };
  return { fail: true, pct: s.intensity };
}
