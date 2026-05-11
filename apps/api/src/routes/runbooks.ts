import type { FastifyInstance } from "fastify";
import { RUNBOOKS, SCENARIOS, SCENARIO_IDS, isScenarioId } from "@firedrill/shared";

export async function runbookRoutes(app: FastifyInstance) {
  app.get("/api/runbooks", async () => {
    return {
      runbooks: SCENARIO_IDS.map((id) => ({
        scenario: SCENARIOS[id],
        runbook: RUNBOOKS[id],
      })),
    };
  });

  app.get<{ Params: { id: string } }>("/api/runbooks/:id", async (req, reply) => {
    if (!isScenarioId(req.params.id)) return reply.code(404).send({ error: "not found" });
    return { scenario: SCENARIOS[req.params.id], runbook: RUNBOOKS[req.params.id] };
  });
}
