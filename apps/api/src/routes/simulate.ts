import type { FastifyInstance } from "fastify";
import { SCENARIOS, SCENARIO_IDS, isScenarioId } from "@firedrill/shared";
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
import { startBacklog, stopBacklog } from "../backlog.js";
import { badRequest, notFound } from "../errors.js";
import { logger } from "../logger.js";

interface SimulateBody {
  enabled?: boolean;
  intensity?: number;
}

export async function simulateRoutes(app: FastifyInstance) {
  app.get("/api/scenarios", async () => {
    const states = await getAllScenarios();
    const byId = new Map(states.map((s) => [s.id, s]));
    return {
      scenarios: SCENARIO_IDS.map((id) => ({
        ...SCENARIOS[id],
        state: byId.get(id)!,
      })),
    };
  });

  app.post<{ Params: { scenario: string }; Body: SimulateBody }>(
    "/api/simulate/:scenario",
    async (req) => {
      const { scenario } = req.params;
      if (!isScenarioId(scenario)) {
        throw notFound(`unknown scenario '${scenario}'`);
      }

      const body = req.body ?? {};
      if (body.intensity !== undefined && typeof body.intensity !== "number") {
        throw badRequest("intensity must be a number");
      }
      const enabled = body.enabled ?? true;

      if (enabled) {
        const existing = await activeIncidentForScenario(scenario);
        const incident = existing ?? (await createIncident(scenario));
        const state = await enableScenario(scenario, {
          intensity: body.intensity,
          incidentId: incident.id,
        });
        if (scenario === "queue_backlog") startBacklog(state.intensity);
        if (scenario === "memory_pressure") startMemoryPressure(state.intensity);
        logger.warn(
          { scenario, intensity: state.intensity, incidentId: incident.id },
          "scenario enabled",
        );
        return { scenario: state, incident };
      }

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
    },
  );

  app.post("/api/simulate/reset", async () => {
    await resetAll();
    stopBacklog();
    stopMemoryPressure();
    logger.warn("all scenarios reset");
    return { ok: true };
  });

  app.get<{ Params: { scenario: string } }>(
    "/api/scenarios/:scenario",
    async (req) => {
      if (!isScenarioId(req.params.scenario)) {
        throw notFound(`unknown scenario '${req.params.scenario}'`);
      }
      return getScenario(req.params.scenario);
    },
  );
}
