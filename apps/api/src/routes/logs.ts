import type { FastifyInstance } from "fastify";
import { recentLogs } from "../logger.js";
import { badRequest } from "../errors.js";

export async function logRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { limit?: string } }>("/api/logs", async (req) => {
    const raw = req.query.limit;
    const limit = raw === undefined ? 200 : Number(raw);
    if (!Number.isFinite(limit) || limit < 1) {
      throw badRequest("limit must be a positive integer");
    }
    return { logs: recentLogs(limit) };
  });
}
