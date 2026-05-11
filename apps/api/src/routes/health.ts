import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { dbQueryDuration, databaseHealthy } from "../metrics.js";
import { isActive, intensityIfActive } from "../scenarios.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (_req, reply) => {
    const start = Date.now();
    const end = dbQueryDuration.labels("health").startTimer();
    let dbOk = true;
    try {
      const slowdown = await intensityIfActive("db_slowdown");
      if (slowdown) await new Promise((r) => setTimeout(r, slowdown));
      await pool.query("SELECT 1");
    } catch {
      dbOk = false;
    } finally {
      end();
    }
    databaseHealthy.set(dbOk ? 1 : 0);
    const degraded = !dbOk || (await isActive("db_slowdown"));
    const body = {
      status: dbOk ? (degraded ? "degraded" : "healthy") : "down",
      service: "api",
      database: dbOk ? "ok" : "down",
      latencyMs: Date.now() - start,
      at: new Date().toISOString(),
    };
    reply.code(dbOk ? 200 : 503).send(body);
  });
}
