import type { FastifyInstance } from "fastify";
import {
  appendTimeline,
  getIncident,
  listIncidents,
  resolveIncident,
} from "../incidents.js";
import { generateReport } from "../reports.js";

export async function incidentRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { status?: "open" | "resolved"; limit?: string } }>(
    "/api/incidents",
    async (req) => {
      const status = req.query.status;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
      const items = await listIncidents({ status, limit });
      return { incidents: items };
    },
  );

  app.get<{ Params: { id: string } }>("/api/incidents/:id", async (req, reply) => {
    const inc = await getIncident(req.params.id);
    if (!inc) return reply.code(404).send({ error: "not found" });
    return inc;
  });

  app.post<{ Params: { id: string } }>("/api/incidents/:id/resolve", async (req, reply) => {
    const inc = await resolveIncident(req.params.id);
    if (!inc) return reply.code(404).send({ error: "not found or already resolved" });
    return inc;
  });

  app.post<{
    Params: { id: string };
    Body: { kind: string; message: string };
  }>("/api/incidents/:id/timeline", async (req, reply) => {
    const { kind, message } = req.body ?? ({} as { kind: string; message: string });
    if (!kind || !message) return reply.code(400).send({ error: "kind and message required" });
    await appendTimeline(req.params.id, {
      at: new Date().toISOString(),
      kind,
      message,
    });
    const inc = await getIncident(req.params.id);
    return inc;
  });

  app.get<{ Params: { id: string } }>("/api/incidents/:id/report", async (req, reply) => {
    const inc = await getIncident(req.params.id);
    if (!inc) return reply.code(404).send({ error: "not found" });
    return generateReport(inc);
  });
}
