import { redis } from "./redis.js";
import { setScenarioGauge } from "./metrics.js";
import { SCENARIOS, SCENARIO_IDS, isScenarioId } from "@firedrill/shared";
import type { ScenarioId, ScenarioState } from "@firedrill/shared";

const KEY = (id: ScenarioId) => `firedrill:scenario:${id}`;

export async function getScenario(id: ScenarioId): Promise<ScenarioState> {
  const raw = await redis.get(KEY(id));
  if (!raw) {
    return {
      id,
      active: false,
      startedAt: null,
      endedAt: null,
      intensity: SCENARIOS[id].defaultIntensity,
      incidentId: null,
    };
  }
  return JSON.parse(raw) as ScenarioState;
}

export async function getAllScenarios(): Promise<ScenarioState[]> {
  return Promise.all(SCENARIO_IDS.map((id) => getScenario(id)));
}

export async function setScenario(state: ScenarioState): Promise<ScenarioState> {
  await redis.set(KEY(state.id), JSON.stringify(state));
  setScenarioGauge(state.id, state.active);
  return state;
}

export async function enableScenario(
  id: ScenarioId,
  opts: { intensity?: number; incidentId: string },
): Promise<ScenarioState> {
  if (!isScenarioId(id)) throw new Error(`unknown scenario: ${id}`);
  const next: ScenarioState = {
    id,
    active: true,
    startedAt: new Date().toISOString(),
    endedAt: null,
    intensity: opts.intensity ?? SCENARIOS[id].defaultIntensity,
    incidentId: opts.incidentId,
  };
  return setScenario(next);
}

export async function disableScenario(id: ScenarioId): Promise<ScenarioState> {
  const current = await getScenario(id);
  const next: ScenarioState = {
    ...current,
    active: false,
    endedAt: new Date().toISOString(),
  };
  return setScenario(next);
}

export async function resetAll(): Promise<void> {
  await Promise.all(
    SCENARIO_IDS.map(async (id) => {
      await redis.del(KEY(id));
      setScenarioGauge(id, false);
    }),
  );
}

export async function isActive(id: ScenarioId): Promise<boolean> {
  const s = await getScenario(id);
  return s.active;
}

export async function intensityIfActive(id: ScenarioId): Promise<number | null> {
  const s = await getScenario(id);
  return s.active ? s.intensity : null;
}
