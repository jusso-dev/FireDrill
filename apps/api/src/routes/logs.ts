import type { FastifyInstance } from "fastify";
import { recentLogs } from "../logger.js";

export async function logRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { limit?: string } }>("/api/logs", async (req) => {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 200;
    return { logs: recentLogs(limit) };
  });
}
