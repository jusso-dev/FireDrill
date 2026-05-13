import { Redis } from "ioredis";
import { config } from "./config.js";
import { logger } from "./logger.js";

export const redis = new Redis(config.redisUrl, {
  // BullMQ requires this to be null so blocking commands don't get cancelled.
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  // Exponential-ish backoff capped at 5s. Surface the first few attempts.
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5_000);
    if (times <= 3) logger.warn({ times, delay }, "redis reconnect");
    return delay;
  },
});

redis.on("error", (err: Error) => {
  // ioredis is chatty on disconnect; log once at warn and rely on retryStrategy
  // for visibility on reconnection attempts.
  logger.warn({ err: err.message }, "redis error");
});
redis.on("end", () => logger.warn("redis connection closed"));
redis.on("ready", () => logger.info("redis ready"));

export async function closeRedis(): Promise<void> {
  await redis.quit().catch(() => redis.disconnect());
}
