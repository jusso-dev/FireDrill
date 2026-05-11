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
    // 1) Dashboard loads
    await page.goto("/");
    await expect(page.getByText("System Health")).toBeVisible();

    // 2) Enable latency_spike via scenarios page
    await page.goto("/scenarios");
    const latencyCard = page.locator("text=Latency Spike").locator("..").locator("..");
    await latencyCard.getByRole("button", { name: /enable/i }).click();
    await expect(latencyCard.getByText(/live/i)).toBeVisible();

    // 3) Active incident shows up on overview
    await page.goto("/");
    await expect(
      page.getByText(/Active incidents/i).first(),
    ).toBeVisible();

    // 4) Disable via API and confirm UI updates
    const list = await request.get("/api/proxy/api/incidents?status=open").then((r) => r.json());
    expect(list.incidents.length).toBeGreaterThan(0);
    const incidentId = list.incidents[0].id;

    await request.post("/api/proxy/api/simulate/latency_spike", {
      data: { enabled: false },
    });

    // 5) Generate report
    const reportRes = await request.get(`/api/proxy/api/incidents/${incidentId}/report`);
    expect(reportRes.ok()).toBeTruthy();
    const report = await reportRes.json();
    expect(report.incidentId).toBe(incidentId);
    expect(report.detectedSymptoms.length).toBeGreaterThan(0);
    expect(report.remediation.length).toBeGreaterThan(0);
  });
});
