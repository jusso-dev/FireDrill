import type { FastifyInstance } from "fastify";
import { Queue } from "bullmq";
import { redis } from "../redis.js";
import { isScenarioId, SCENARIOS, SCENARIO_IDS } from "@firedrill/shared";
import {
  disableScenario,
  enableScenario,
  getAllScenarios,
  getScenario,
  resetAll,
} from "../scenarios.js";
import {
  activeIncidentForScenario,
  appendTimeline,
  createIncident,
  resolveIncident,
} from "../incidents.js";
import { startMemoryPressure, stopMemoryPressure } from "../memory.js";
import { logger } from "../logger.js";

const backlogQueue = new Queue("emails", { connection: redis });
let backlogInterval: NodeJS.Timeout | null = null;

function startBacklog(perSecond: number) {
  if (backlogInterval) clearInterval(backlogInterval);
  const safe = Math.min(Math.max(1, perSecond), 100);
  backlogInterval = setInterval(async () => {
    try {
      await backlogQueue.addBulk(
        Array.from({ length: safe }, (_, i) => ({
          name: "backlog_email",
          data: { i, ts: Date.now() },
        })),
      );
    } catch (err) {
      logger.error({ err }, "backlog producer failed");
    }
  }, 1000);
}

function stopBacklog() {
  if (backlogInterval) {
    clearInterval(backlogInterval);
    backlogInterval = null;
  }
}

export async function simulateRoutes(app: FastifyInstance) {
  app.get("/api/scenarios", async () => {
    const states = await getAllScenarios();
    return {
      scenarios: SCENARIO_IDS.map((id) => ({
        ...SCENARIOS[id],
        state: states.find((s) => s.id === id)!,
      })),
    };
  });

  app.post<{
    Params: { scenario: string };
    Body: { enabled?: boolean; intensity?: number };
  }>("/api/simulate/:scenario", async (req, reply) => {
    const { scenario } = req.params;
    if (!isScenarioId(scenario)) {
      return reply.code(400).send({ error: `unknown scenario: ${scenario}` });
    }
    const enabled = req.body?.enabled ?? true;

    if (enabled) {
      const existing = await activeIncidentForScenario(scenario);
      const incident = existing ?? (await createIncident(scenario));
      const state = await enableScenario(scenario, {
        intensity: req.body?.intensity,
        incidentId: incident.id,
      });
      if (scenario === "queue_backlog") startBacklog(state.intensity);
      if (scenario === "memory_pressure") startMemoryPressure(state.intensity);
      logger.warn({ scenario, incidentId: incident.id }, "scenario enabled");
      return { scenario: state, incident };
    } else {
      const state = await disableScenario(scenario);
      if (scenario === "queue_backlog") stopBacklog();
      if (scenario === "memory_pressure") stopMemoryPressure();
      let incident = null;
      if (state.incidentId) {
        incident = await resolveIncident(state.incidentId);
        if (incident) {
          await appendTimeline(incident.id, {
            at: new Date().toISOString(),
            kind: "scenario_disabled",
            message: `${SCENARIOS[scenario].name} scenario disabled`,
          });
        }
      }
      logger.info({ scenario }, "scenario disabled");
      return { scenario: state, incident };
    }
  });

  app.post("/api/simulate/reset", async () => {
    await resetAll();
    stopBacklog();
    stopMemoryPressure();
    return { ok: true };
  });

  app.get<{ Params: { scenario: string } }>(
    "/api/scenarios/:scenario",
    async (req, reply) => {
      if (!isScenarioId(req.params.scenario)) {
        return reply.code(404).send({ error: "unknown scenario" });
      }
      return getScenario(req.params.scenario);
    },
  );
}
