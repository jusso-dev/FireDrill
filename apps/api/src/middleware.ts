import type { FastifyInstance, FastifyRequest } from "fastify";
import { httpDuration, httpRequests } from "./metrics.js";
import { intensityIfActive, isActive } from "./scenarios.js";

const PUBLIC_ROUTES = new Set(["/metrics", "/health"]);

function routeLabel(req: FastifyRequest): string {
  // Fastify route info preferred over raw url to keep cardinality low
  return (req.routeOptions?.url as string | undefined) ?? req.url.split("?")[0] ?? "unknown";
}

export function registerMetricsHook(app: FastifyInstance) {
  app.addHook("onRequest", async (req) => {
    (req as unknown as { startHrTime: bigint }).startHrTime = process.hrtime.bigint();
  });

  app.addHook("preHandler", async (req, reply) => {
    const route = routeLabel(req);
    if (PUBLIC_ROUTES.has(route)) return;

    const latencyMs = await intensityIfActive("latency_spike");
    if (latencyMs) {
      const jitter = Math.random() * (latencyMs * 0.3);
      await new Promise((r) => setTimeout(r, latencyMs + jitter));
    }

    if (await isActive("error_storm")) {
      const storm = await intensityIfActive("error_storm");
      const pct = storm ?? 35;
      if (Math.random() * 100 < pct) {
        reply.code(500).send({ error: "synthetic error storm" });
      }
    }
  });

  app.addHook("onResponse", async (req, reply) => {
    const start = (req as unknown as { startHrTime?: bigint }).startHrTime;
    if (!start) return;
    const seconds = Number(process.hrtime.bigint() - start) / 1e9;
    const route = routeLabel(req);
    const status = String(reply.statusCode);
    httpRequests.labels(req.method, route, status).inc();
    httpDuration.labels(req.method, route, status).observe(seconds);
  });
}
