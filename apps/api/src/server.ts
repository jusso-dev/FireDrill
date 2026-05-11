import Fastify from "fastify";
import { logger } from "./logger.js";
import { migrate } from "./db.js";
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

async function main() {
  const app = Fastify({
    loggerInstance: logger,
    disableRequestLogging: false,
  });

  try {
    await app.register(import("@fastify/cors"), { origin: true });
  } catch {
    // optional, skip
  }

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

  await migrate();
  initScenarioGauges();
  await refreshActiveGauge();

  const port = parseInt(process.env.API_PORT ?? "4000", 10);
  await app.listen({ port, host: "0.0.0.0" });
  logger.info({ port }, "FireDrill API listening");
}

main().catch((err) => {
  logger.error({ err }, "API failed to start");
  process.exit(1);
});
