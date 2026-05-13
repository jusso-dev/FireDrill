import Fastify from "fastify";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { closeDb, migrate } from "./db.js";
import { closeRedis } from "./redis.js";
import { closeQueues } from "./queues.js";
import { initScenarioGauges, register } from "./metrics.js";
import { registerMetricsHook } from "./middleware.js";
import { healthRoutes } from "./routes/health.js";
import { productRoutes } from "./routes/products.js";
import { orderRoutes } from "./routes/orders.js";
import { simulateRoutes } from "./routes/simulate.js";
import { incidentRoutes } from "./routes/incidents.js";
import { overviewRoutes } from "./routes/overview.js";
import { logRoutes } from "./routes/logs.js";
import { runbookRoutes } from "./routes/runbooks.js";
import { refreshActiveGauge } from "./incidents.js";
import { stopBacklog } from "./backlog.js";
import { stopMemoryPressure } from "./memory.js";
import { HttpError, type ErrorBody } from "./errors.js";

async function build() {
  const app = Fastify({
    loggerInstance: logger,
    disableRequestLogging: false,
    trustProxy: true,
  });

  await app.register(import("@fastify/cors"), { origin: true });

  app.setErrorHandler((err: Error & { statusCode?: number; code?: string }, req, reply) => {
    if (err instanceof HttpError) {
      const body: ErrorBody = {
        error: { code: err.code, message: err.message, details: err.details },
      };
      return reply.code(err.statusCode).send(body);
    }
    // Fastify built-in validation/parse errors carry a numeric statusCode.
    const status = err.statusCode;
    if (typeof status === "number" && status >= 400 && status < 500) {
      const body: ErrorBody = {
        error: { code: err.code ?? "bad_request", message: err.message },
      };
      return reply.code(status).send(body);
    }
    // Anything else is a bug. Log with full context, return a generic 500.
    req.log.error(
      { err: err.message, stack: err.stack, route: req.url, method: req.method },
      "unhandled route error",
    );
    const body: ErrorBody = {
      error: { code: "internal", message: "internal server error" },
    };
    return reply.code(500).send(body);
  });

  app.setNotFoundHandler((_req, reply) => {
    const body: ErrorBody = { error: { code: "not_found", message: "not found" } };
    return reply.code(404).send(body);
  });

  registerMetricsHook(app);

  app.get("/metrics", async (_req, reply) => {
    reply.header("Content-Type", register.contentType);
    return register.metrics();
  });

  await app.register(healthRoutes);
  await app.register(productRoutes);
  await app.register(orderRoutes);
  await app.register(simulateRoutes);
  await app.register(incidentRoutes);
  await app.register(overviewRoutes);
  await app.register(logRoutes);
  await app.register(runbookRoutes);

  return app;
}

async function shutdown(
  app: Awaited<ReturnType<typeof build>>,
  signal: string,
): Promise<void> {
  logger.info({ signal }, "shutdown: starting");
  stopBacklog();
  stopMemoryPressure();
  try {
    await app.close();
  } catch (err) {
    logger.error({ err: (err as Error).message }, "shutdown: fastify close failed");
  }
  // Close downstream connections after the HTTP server is no longer
  // accepting traffic, so in-flight requests drain cleanly first.
  await Promise.allSettled([closeQueues(), closeRedis(), closeDb()]);
  logger.info("shutdown: complete");
}

async function main(): Promise<void> {
  const app = await build();

  // Run migrations and prime metrics before accepting traffic, otherwise the
  // first scrape can race with the schema being created.
  await migrate();
  initScenarioGauges();
  await refreshActiveGauge();

  await app.listen({ port: config.port, host: "0.0.0.0" });
  logger.info({ port: config.port, env: config.nodeEnv }, "FireDrill API listening");

  let shuttingDown = false;
  const onSignal = (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    shutdown(app, signal)
      .then(() => process.exit(0))
      .catch((err) => {
        logger.error({ err: (err as Error).message }, "shutdown failed");
        process.exit(1);
      });
  };

  process.on("SIGTERM", onSignal);
  process.on("SIGINT", onSignal);

  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "unhandled promise rejection");
  });
  process.on("uncaughtException", (err) => {
    logger.fatal({ err: err.message, stack: err.stack }, "uncaught exception");
    onSignal("SIGTERM");
  });
}

main().catch((err) => {
  logger.error({ err: err instanceof Error ? err.message : String(err) }, "API failed to start");
  process.exit(1);
});
