import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../scenarios.js", () => ({
  shouldFail: vi.fn(),
}));

vi.mock("../logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { handleEmail, handleOrder } = await import("../jobs.js");
const scenarios = await import("../scenarios.js");

const job = { id: "1", name: "test", data: {} } as unknown as Parameters<typeof handleEmail>[0];

beforeEach(() => vi.clearAllMocks());

describe("worker job handlers", () => {
  it("handleEmail succeeds when no scenario", async () => {
    (scenarios.shouldFail as ReturnType<typeof vi.fn>).mockResolvedValue({
      fail: false,
      pct: 0,
    });
    await expect(handleEmail(job)).resolves.toBeUndefined();
  });

  it("handleEmail throws when 100% failure", async () => {
    (scenarios.shouldFail as ReturnType<typeof vi.fn>).mockResolvedValue({
      fail: true,
      pct: 100,
    });
    await expect(handleEmail(job)).rejects.toThrow(/synthetic worker failure/);
  });

  it("handleOrder throws when 100% failure", async () => {
    (scenarios.shouldFail as ReturnType<typeof vi.fn>).mockResolvedValue({
      fail: true,
      pct: 100,
    });
    await expect(handleOrder(job)).rejects.toThrow(/synthetic worker failure/);
  });
});
