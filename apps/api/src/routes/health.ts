import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { databaseHealthy, dbQueryDuration } from "../metrics.js";
import { intensityIfActive, isActive } from "../scenarios.js";

type HealthStatus = "healthy" | "degraded" | "down";

interface HealthBody {
  status: HealthStatus;
  service: "api";
  database: "ok" | "down";
  latencyMs: number;
  at: string;
}

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (_req, reply) => {
    const start = Date.now();
    const end = dbQueryDuration.labels("health").startTimer();
    let dbOk = true;
    try {
      const slowdown = await intensityIfActive("db_slowdown");
      if (slowdown && slowdown > 0) {
        await new Promise((resolve) => setTimeout(resolve, slowdown));
      }
      await pool.query("SELECT 1");
    } catch {
      dbOk = false;
    } finally {
      end();
    }
    databaseHealthy.set(dbOk ? 1 : 0);

    const dbSlow = dbOk ? await isActive("db_slowdown") : false;
    const status: HealthStatus = !dbOk ? "down" : dbSlow ? "degraded" : "healthy";
    const body: HealthBody = {
      status,
      service: "api",
      database: dbOk ? "ok" : "down",
      latencyMs: Date.now() - start,
      at: new Date().toISOString(),
    };
    return reply.code(dbOk ? 200 : 503).send(body);
  });
}
