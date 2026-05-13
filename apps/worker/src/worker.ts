import { Worker, Queue, type Job } from "bullmq";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { closeRedis, redis } from "./redis.js";
import {
  jobDuration,
  jobsFailed,
  jobsProcessed,
  queueDepth,
  startMetricsServer,
} from "./metrics.js";
import { handleEmail, handleInvoice, handleOrder } from "./jobs.js";

type Handler = (job: Job) => Promise<void>;

interface QueueDef {
  name: string;
  handler: Handler;
}

const QUEUE_DEFS: QueueDef[] = [
  { name: "emails", handler: handleEmail },
  { name: "orders", handler: handleOrder },
  { name: "invoices", handler: handleInvoice },
];

function createWorker(def: QueueDef): { queue: Queue; worker: Worker } {
  const queue = new Queue(def.name, { connection: redis });

  const worker = new Worker(
    def.name,
    async (job) => {
      const end = jobDuration.labels(def.name, job.name).startTimer();
      try {
        await def.handler(job);
        jobsProcessed.labels(def.name, job.name, "success").inc();
      } catch (err) {
        jobsProcessed.labels(def.name, job.name, "failed").inc();
        jobsFailed.labels(def.name, job.name).inc();
        throw err;
      } finally {
        end();
      }
    },
    { connection: redis, concurrency: config.concurrency },
  );

  worker.on("failed", (job, err) => {
    logger.warn(
      { queue: def.name, jobId: job?.id, name: job?.name, err: err.message },
      "job failed",
    );
  });
  worker.on("error", (err) => {
    logger.error({ queue: def.name, err: err.message }, "worker error");
  });

  logger.info({ queue: def.name, concurrency: config.concurrency }, "worker started");
  return { queue, worker };
}

async function main(): Promise<void> {
  const components = QUEUE_DEFS.map(createWorker);
  const queues = components.map((c) => c.queue);
  const workers = components.map((c) => c.worker);

  // Refresh queue-depth gauge on a fixed cadence. Failures here are
  // non-fatal — Redis hiccups would otherwise crash the whole worker.
  const depthTimer = setInterval(async () => {
    await Promise.all(
      queues.map(async (q) => {
        try {
          const counts = await q.getJobCounts("wait");
          queueDepth.labels(q.name).set(counts.wait ?? 0);
        } catch (err) {
          logger.warn(
            { queue: q.name, err: (err as Error).message },
            "queue depth poll failed",
          );
        }
      }),
    );
  }, config.depthPollMs);

  const httpServer = startMetricsServer(config.metricsPort);
  logger.info({ port: config.metricsPort }, "FireDrill worker metrics listening");

  let shuttingDown = false;
  async function shutdown(signal: NodeJS.Signals): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "shutdown: starting");
    clearInterval(depthTimer);

    httpServer.close();

    // Closing workers waits for in-flight jobs to finish.
    await Promise.allSettled(workers.map((w) => w.close()));
    await Promise.allSettled(queues.map((q) => q.close()));
    await closeRedis();

    logger.info("shutdown: complete");
    process.exit(0);
  }

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "unhandled promise rejection");
  });
  process.on("uncaughtException", (err) => {
    logger.fatal({ err: err.message, stack: err.stack }, "uncaught exception");
    shutdown("SIGTERM");
  });
}

main().catch((err) => {
  logger.error(
    { err: err instanceof Error ? err.message : String(err) },
    "worker failed to start",
  );
  process.exit(1);
});
