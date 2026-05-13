import { redis } from "./redis.js";
import { setScenarioGauge } from "./metrics.js";
import {
  SCENARIOS,
  SCENARIO_IDS,
  clampIntensity,
  isScenarioId,
} from "@firedrill/shared";
import type { ScenarioId, ScenarioState } from "@firedrill/shared";
import { logger } from "./logger.js";

const KEY = (id: ScenarioId) => `firedrill:scenario:${id}`;

function defaultState(id: ScenarioId): ScenarioState {
  return {
    id,
    active: false,
    startedAt: null,
    endedAt: null,
    intensity: SCENARIOS[id].defaultIntensity,
    incidentId: null,
  };
}

export async function getScenario(id: ScenarioId): Promise<ScenarioState> {
  const raw = await redis.get(KEY(id));
  if (!raw) return defaultState(id);
  try {
    return JSON.parse(raw) as ScenarioState;
  } catch (err) {
    // Corrupt blob — reset rather than serving garbage.
    logger.warn(
      { id, err: (err as Error).message },
      "scenario state corrupt; resetting to default",
    );
    return defaultState(id);
  }
}

export async function getAllScenarios(): Promise<ScenarioState[]> {
  return Promise.all(SCENARIO_IDS.map((id) => getScenario(id)));
}

async function persist(state: ScenarioState): Promise<ScenarioState> {
  await redis.set(KEY(state.id), JSON.stringify(state));
  setScenarioGauge(state.id, state.active);
  return state;
}

export async function enableScenario(
  id: ScenarioId,
  opts: { intensity?: unknown; incidentId: string },
): Promise<ScenarioState> {
  if (!isScenarioId(id)) throw new Error(`unknown scenario: ${id}`);
  return persist({
    id,
    active: true,
    startedAt: new Date().toISOString(),
    endedAt: null,
    intensity: clampIntensity(id, opts.intensity),
    incidentId: opts.incidentId,
  });
}

export async function disableScenario(id: ScenarioId): Promise<ScenarioState> {
  const current = await getScenario(id);
  return persist({ ...current, active: false, endedAt: new Date().toISOString() });
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
  return (await getScenario(id)).active;
}

export async function intensityIfActive(id: ScenarioId): Promise<number | null> {
  const s = await getScenario(id);
  return s.active ? s.intensity : null;
}
