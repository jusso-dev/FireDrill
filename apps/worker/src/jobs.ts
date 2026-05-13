import type { Job } from "bullmq";
import { logger } from "./logger.js";
import { shouldFail } from "./scenarios.js";

async function maybeInjectFailure(job: Job): Promise<void> {
  const { pct } = await shouldFail("worker_failure");
  if (pct > 0 && Math.random() * 100 < pct) {
    throw new Error(`synthetic worker failure on ${job.name} (intensity=${pct}%)`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function handleEmail(job: Job): Promise<void> {
  await maybeInjectFailure(job);
  await sleep(20 + Math.random() * 60);
  logger.debug({ jobId: job.id, name: job.name }, "email sent");
}

export async function handleOrder(job: Job): Promise<void> {
  await maybeInjectFailure(job);
  await sleep(40 + Math.random() * 100);
  logger.info({ jobId: job.id, data: job.data }, "order processed");
}

export async function handleInvoice(job: Job): Promise<void> {
  await maybeInjectFailure(job);
  await sleep(80 + Math.random() * 200);
  logger.debug({ jobId: job.id }, "invoice generated");
}
