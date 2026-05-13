import type { FastifyInstance } from "fastify";
import {
  appendTimeline,
  getIncident,
  listIncidents,
  resolveIncident,
} from "../incidents.js";
import { generateReport } from "../reports.js";
import { badRequest, conflict, notFound } from "../errors.js";

interface ListQuery {
  status?: "open" | "resolved";
  limit?: string;
}

interface TimelineBody {
  kind?: string;
  message?: string;
}

export async function incidentRoutes(app: FastifyInstance) {
  app.get<{ Querystring: ListQuery }>("/api/incidents", async (req) => {
    const { status } = req.query;
    if (status !== undefined && status !== "open" && status !== "resolved") {
      throw badRequest("status must be 'open' or 'resolved'");
    }
    const limit = req.query.limit !== undefined ? Number(req.query.limit) : 50;
    if (!Number.isFinite(limit) || limit < 1) {
      throw badRequest("limit must be a positive integer");
    }
    return { incidents: await listIncidents({ status, limit }) };
  });

  app.get<{ Params: { id: string } }>("/api/incidents/:id", async (req) => {
    const inc = await getIncident(req.params.id);
    if (!inc) throw notFound(`incident ${req.params.id} not found`);
    return inc;
  });

  app.post<{ Params: { id: string } }>(
    "/api/incidents/:id/resolve",
    async (req) => {
      const inc = await resolveIncident(req.params.id);
      if (!inc) {
        // The row either doesn't exist or is already resolved — caller can't
        // disambiguate without checking, but conflict is the more useful hint.
        throw conflict(`incident ${req.params.id} not found or already resolved`);
      }
      return inc;
    },
  );

  app.post<{ Params: { id: string }; Body: TimelineBody }>(
    "/api/incidents/:id/timeline",
    async (req) => {
      const { kind, message } = req.body ?? {};
      if (!kind || typeof kind !== "string") {
        throw badRequest("kind is required");
      }
      if (!message || typeof message !== "string") {
        throw badRequest("message is required");
      }
      await appendTimeline(req.params.id, {
        at: new Date().toISOString(),
        kind,
        message,
      });
      const inc = await getIncident(req.params.id);
      if (!inc) throw notFound(`incident ${req.params.id} not found`);
      return inc;
    },
  );

  app.get<{ Params: { id: string } }>(
    "/api/incidents/:id/report",
    async (req) => {
      const inc = await getIncident(req.params.id);
      if (!inc) throw notFound(`incident ${req.params.id} not found`);
      return generateReport(inc);
    },
  );
}
