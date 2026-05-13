import { config } from "./config.js";
import { memoryBallastBytes } from "./metrics.js";
import { logger } from "./logger.js";

const STEP_MB = 8;
const STEP_BYTES = STEP_MB * 1024 * 1024;
const TICK_MS = 250;

const buffers: Buffer[] = [];
let timer: NodeJS.Timeout | null = null;
let targetBytes = 0;

function updateGauge(): void {
  memoryBallastBytes.set(buffers.length * STEP_BYTES);
}

/**
 * Allocate a capped buffer over time to simulate memory growth without
 * actually risking the host. Subsequent calls re-target without releasing
 * existing allocations (so toggling intensity up is monotonic).
 */
export function startMemoryPressure(targetMb: number): void {
  const capped = Math.min(Math.max(1, Math.floor(targetMb)), config.memoryPressureCapMb);
  targetBytes = capped * 1024 * 1024;
  logger.info({ targetMb: capped, capMb: config.memoryPressureCapMb }, "memory pressure: starting");

  if (timer) return;
  timer = setInterval(() => {
    if (buffers.length * STEP_BYTES >= targetBytes) {
      // Reached target — keep timer alive so a later bump can grow further.
      return;
    }
    try {
      buffers.push(Buffer.alloc(STEP_BYTES, 0x42));
      updateGauge();
    } catch (err) {
      logger.error({ err: (err as Error).message }, "memory pressure: alloc failed; stopping");
      stopMemoryPressure();
    }
  }, TICK_MS);
}

export function stopMemoryPressure(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (buffers.length === 0) return;
  buffers.length = 0;
  targetBytes = 0;
  updateGauge();
  // `global.gc` is only present with --expose-gc; ignore otherwise.
  const gc = (globalThis as { gc?: () => void }).gc;
  if (typeof gc === "function") gc();
  logger.info("memory pressure: stopped");
}
