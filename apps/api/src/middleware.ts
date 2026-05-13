import type { FastifyReply, FastifyRequest } from "fastify";
import { httpDuration, httpRequests } from "./metrics.js";
import { intensityIfActive, isActive } from "./scenarios.js";

const PUBLIC_ROUTES = new Set(["/metrics", "/health"]);
const START_KEY = Symbol("startHrTime");

type Timed = FastifyRequest & { [START_KEY]?: bigint };

/** Minimal hook surface — generic over the precise Fastify type to avoid
 *  parameter-mismatch noise when callers use a custom `loggerInstance`. */
interface HookableApp {
  addHook(event: "onRequest", fn: (req: FastifyRequest) => Promise<void>): unknown;
  addHook(
    event: "preHandler",
    fn: (req: FastifyRequest, reply: FastifyReply) => Promise<unknown>,
  ): unknown;
  addHook(
    event: "onResponse",
    fn: (req: FastifyRequest, reply: FastifyReply) => Promise<void>,
  ): unknown;
}

/** Use Fastify's matched route URL when available — keeps Prom label cardinality low. */
function routeLabel(req: FastifyRequest): string {
  return req.routeOptions?.url ?? req.url.split("?")[0] ?? "unknown";
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function registerMetricsHook(app: HookableApp): void {
  app.addHook("onRequest", async (req) => {
    (req as Timed)[START_KEY] = process.hrtime.bigint();
  });

  app.addHook("preHandler", async (req, reply: FastifyReply) => {
    const route = routeLabel(req);
    if (PUBLIC_ROUTES.has(route)) return;

    const latencyMs = await intensityIfActive("latency_spike");
    if (latencyMs && latencyMs > 0) {
      const jitter = Math.random() * (latencyMs * 0.3);
      await sleep(latencyMs + jitter);
    }

    if (await isActive("error_storm")) {
      const pct = (await intensityIfActive("error_storm")) ?? 0;
      if (pct > 0 && Math.random() * 100 < pct) {
        // Return the reply to short-circuit so no subsequent handler responds.
        return reply.code(500).send({
          error: { code: "synthetic_error_storm", message: "synthetic error storm" },
        });
      }
    }
  });

  app.addHook("onResponse", async (req, reply) => {
    const start = (req as Timed)[START_KEY];
    if (start === undefined) return;
    const seconds = Number(process.hrtime.bigint() - start) / 1e9;
    const route = routeLabel(req);
    const status = String(reply.statusCode);
    httpRequests.labels(req.method, route, status).inc();
    httpDuration.labels(req.method, route, status).observe(seconds);
  });
}
