import type { FastifyInstance } from "fastify";
import { RUNBOOKS, SCENARIOS, SCENARIO_IDS, isScenarioId } from "@firedrill/shared";
import { notFound } from "../errors.js";

export async function runbookRoutes(app: FastifyInstance) {
  app.get("/api/runbooks", async () => ({
    runbooks: SCENARIO_IDS.map((id) => ({
      scenario: SCENARIOS[id],
      runbook: RUNBOOKS[id],
    })),
  }));

  app.get<{ Params: { id: string } }>("/api/runbooks/:id", async (req) => {
    if (!isScenarioId(req.params.id)) {
      throw notFound(`unknown runbook '${req.params.id}'`);
    }
    return {
      scenario: SCENARIOS[req.params.id],
      runbook: RUNBOOKS[req.params.id],
    };
  });
}
