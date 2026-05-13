import { Redis } from "ioredis";
import { config } from "./config.js";
import { logger } from "./logger.js";

export const redis = new Redis(config.redisUrl, {
  // BullMQ blocks on commands; nullifying retries-per-request lets them sit.
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5_000);
    if (times <= 3) logger.warn({ times, delay }, "redis reconnect");
    return delay;
  },
});

redis.on("error", (err: Error) => {
  logger.warn({ err: err.message }, "redis error");
});
redis.on("ready", () => logger.info("redis ready"));

export async function closeRedis(): Promise<void> {
  await redis.quit().catch(() => redis.disconnect());
}
