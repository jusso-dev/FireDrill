import { expect, test } from "@playwright/test";

test.describe("FireDrill dashboard", () => {
  test.beforeEach(async ({ request }) => {
    // Reset all scenarios via the proxy on each run.
    await request.post("/api/proxy/api/simulate/reset", { data: {} });
  });

  test("triggers latency scenario, sees incident, resolves, generates report", async ({
    page,
    request,
  }) => {
    // 1) Overview loads
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
    await expect(page.getByText("Services")).toBeVisible();

    // 2) Trigger latency_spike from the scenarios page
    await page.goto("/scenarios");
    const latencyCard = page
      .locator('h3:has-text("Latency Spike")')
      .locator("xpath=ancestor::*[contains(@class,'rounded-md')][1]");
    await latencyCard.getByRole("button", { name: /trigger/i }).click();
    await expect(latencyCard.getByText("live", { exact: false })).toBeVisible();

    // 3) Active incident appears on overview
    await page.goto("/");
    await expect(page.getByText("Live incidents")).toBeVisible();

    // 4) Disable via API and confirm an incident was recorded
    const list = await request
      .get("/api/proxy/api/incidents?status=open")
      .then((r) => r.json());
    expect(list.incidents.length).toBeGreaterThan(0);
    const incidentId = list.incidents[0].id;

    await request.post("/api/proxy/api/simulate/latency_spike", {
      data: { enabled: false },
    });

    // 5) Generate the post-incident report
    const reportRes = await request.get(
      `/api/proxy/api/incidents/${incidentId}/report`,
    );
    expect(reportRes.ok()).toBeTruthy();
    const report = await reportRes.json();
    expect(report.incidentId).toBe(incidentId);
    expect(report.detectedSymptoms.length).toBeGreaterThan(0);
    expect(report.remediation.length).toBeGreaterThan(0);
  });
});
