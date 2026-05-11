import { memoryBallastBytes } from "./metrics.js";
import { logger } from "./logger.js";

const MAX_MB = 256;
const buffers: Buffer[] = [];
let timer: NodeJS.Timeout | null = null;

export function startMemoryPressure(targetMb: number) {
  stopMemoryPressure();
  const cappedMb = Math.min(Math.max(1, Math.floor(targetMb)), MAX_MB);
  logger.info({ targetMb: cappedMb }, "memory pressure: starting");
  const stepMb = 8;
  let current = 0;
  timer = setInterval(() => {
    if (current >= cappedMb) return;
    buffers.push(Buffer.alloc(stepMb * 1024 * 1024, 0x42));
    current += stepMb;
    memoryBallastBytes.set(buffers.length * stepMb * 1024 * 1024);
  }, 250);
}

export function stopMemoryPressure() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  buffers.length = 0;
  memoryBallastBytes.set(0);
  if (global.gc) global.gc();
  logger.info("memory pressure: stopped");
}
