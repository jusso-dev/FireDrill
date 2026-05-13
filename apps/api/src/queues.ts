import { Queue } from "bullmq";
import { redis } from "./redis.js";
import { logger } from "./logger.js";

/**
 * Single owner of BullMQ Queue instances. Splitting them across modules led
 * to multiple connections per queue name and noisy logs on shutdown.
 */
export const queues = {
  orders: new Queue("orders", { connection: redis }),
  emails: new Queue("emails", { connection: redis }),
} as const;

export type QueueName = keyof typeof queues;

export async function closeQueues(): Promise<void> {
  await Promise.allSettled(
    Object.entries(queues).map(async ([name, q]) => {
      try {
        await q.close();
      } catch (err) {
        logger.warn({ queue: name, err: (err as Error).message }, "queue close failed");
      }
    }),
  );
}
