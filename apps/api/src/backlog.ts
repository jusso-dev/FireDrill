import { config } from "./config.js";
import { logger } from "./logger.js";
import { queues } from "./queues.js";

let timer: NodeJS.Timeout | null = null;

/**
 * Producer that enqueues filler email jobs at the configured rate so the
 * worker can't drain fast enough. Idempotent: calling again with a new rate
 * replaces the interval.
 */
export function startBacklog(perSecond: number): void {
  const rate = Math.min(Math.max(1, Math.floor(perSecond)), config.backlogRateCap);
  stopBacklog();

  logger.info({ rate, cap: config.backlogRateCap }, "backlog producer: starting");
  timer = setInterval(async () => {
    try {
      await queues.emails.addBulk(
        Array.from({ length: rate }, (_, i) => ({
          name: "backlog_email",
          data: { i, ts: Date.now() },
        })),
      );
    } catch (err) {
      logger.error({ err: (err as Error).message }, "backlog producer enqueue failed");
    }
  }, 1_000);
}

export function stopBacklog(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
    logger.info("backlog producer: stopped");
  }
}
