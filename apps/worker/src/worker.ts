import { Worker, Queue, type Job } from "bullmq";
import { logger } from "./logger.js";
import { redis } from "./redis.js";
import {
  jobDuration,
  jobsFailed,
  jobsProcessed,
  queueDepth,
  startMetricsServer,
} from "./metrics.js";
import { handleEmail, handleInvoice, handleOrder } from "./jobs.js";

const QUEUES = ["emails", "orders", "invoices"] as const;
type QueueName = (typeof QUEUES)[number];

const handlers: Record<QueueName, (job: Job) => Promise<void>> = {
  emails: handleEmail,
  orders: handleOrder,
  invoices: handleInvoice,
};

const concurrency = 4;
const queues: Record<QueueName, Queue> = {} as Record<QueueName, Queue>;

for (const name of QUEUES) {
  queues[name] = new Queue(name, { connection: redis });
  const worker = new Worker(
    name,
    async (job) => {
      const end = jobDuration.labels(name, job.name).startTimer();
      try {
        await handlers[name](job);
        jobsProcessed.labels(name, job.name, "success").inc();
      } catch (err) {
        jobsProcessed.labels(name, job.name, "failed").inc();
        jobsFailed.labels(name, job.name).inc();
        throw err;
      } finally {
        end();
      }
    },
    { connection: redis, concurrency },
  );
  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, name: job?.name, err: err.message }, "job failed");
  });
  worker.on("error", (err) => {
    logger.error({ err: err.message }, "worker error");
  });
  logger.info({ queue: name }, "worker started");
}

setInterval(async () => {
  for (const name of QUEUES) {
    const counts = await queues[name].getJobCounts("wait");
    queueDepth.labels(name).set(counts.wait ?? 0);
  }
}, 2000);

const port = parseInt(process.env.WORKER_METRICS_PORT ?? "4001", 10);
startMetricsServer(port);
logger.info({ port }, "FireDrill worker metrics server listening");
