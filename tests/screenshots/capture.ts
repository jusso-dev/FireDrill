/* eslint-disable @typescript-eslint/no-explicit-any */
import { chromium, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const OUT = resolve(process.cwd(), "docs/img");

async function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function shot(page: Page, name: string, fullPage = true) {
  const file = `${OUT}/${name}.png`;
  await page.screenshot({ path: file, fullPage, animations: "disabled" });
  console.log(`✓ ${name}.png`);
}

async function resetAll() {
  await fetch(`${BASE}/api/proxy/api/simulate/reset`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
}

async function setScenario(id: string, enabled: boolean, intensity?: number) {
  await fetch(`${BASE}/api/proxy/api/simulate/${id}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ enabled, intensity }),
  });
}

async function generateTraffic(rounds = 60) {
  const products = await fetch(`${BASE}/api/proxy/api/products`)
    .then((r) => r.json())
    .catch(() => ({ products: [] }));
  const productId = products.products?.[0]?.id ?? 1;
  for (let i = 0; i < rounds; i++) {
    await Promise.all([
      fetch(`${BASE}/api/proxy/api/products`).catch(() => {}),
      fetch(`${BASE}/api/proxy/api/orders`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 + (i % 3) }),
      }).catch(() => {}),
      fetch(`${BASE}/api/proxy/api/products`).catch(() => {}),
    ]);
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await resetAll();

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
  });
  const page = await ctx.newPage();

  console.log("seeding baseline traffic…");
  await generateTraffic(40);

  // 1) Overview, healthy
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await wait(2500);
  await shot(page, "01-overview-healthy");

  // 2) Scenarios cold
  await page.goto(`${BASE}/scenarios`, { waitUntil: "networkidle" });
  await wait(2000);
  await shot(page, "02-scenarios-cold");

  // 3) Fire latency_spike + error_storm, return to overview
  console.log("enabling latency_spike + error_storm…");
  await setScenario("latency_spike", true, 600);
  await setScenario("error_storm", true, 25);
  await generateTraffic(50);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await wait(3500);
  await shot(page, "03-overview-alarm");

  // 4) Scenarios live
  await page.goto(`${BASE}/scenarios`, { waitUntil: "networkidle" });
  await wait(2000);
  await shot(page, "04-scenarios-live");

  // 5) Incidents list
  await page.goto(`${BASE}/incidents`, { waitUntil: "networkidle" });
  await wait(2000);
  await shot(page, "05-incidents-list");

  // 6) Incident detail (pick latest open)
  const openInc = await fetch(`${BASE}/api/proxy/api/incidents?status=open&limit=1`)
    .then((r) => r.json())
    .then((d: any) => d.incidents?.[0]);
  if (openInc) {
    // Generate report by calling endpoint then loading the page; report renders if user clicks button. Skip pre-population and rely on page logic.
    await page.goto(`${BASE}/incidents/${openInc.id}`, { waitUntil: "networkidle" });
    await wait(2000);
    await page.getByRole("button", { name: /generate report/i }).click().catch(() => {});
    await wait(2000);
    await shot(page, "06-incident-detail");
  }

  // 7) Services
  await page.goto(`${BASE}/services`, { waitUntil: "networkidle" });
  await wait(2000);
  await shot(page, "07-services");

  // 8) Enable queue_backlog + worker_failure for jobs page
  console.log("enabling queue + worker failure…");
  await setScenario("queue_backlog", true, 40);
  await setScenario("worker_failure", true, 50);
  await generateTraffic(30);
  await wait(5000);
  await page.goto(`${BASE}/jobs`, { waitUntil: "networkidle" });
  await wait(2000);
  await shot(page, "08-jobs");

  // 9) Logs
  await page.goto(`${BASE}/logs`, { waitUntil: "networkidle" });
  await wait(2000);
  await shot(page, "09-logs");

  // 10) Reports
  await page.goto(`${BASE}/reports`, { waitUntil: "networkidle" });
  await wait(1500);
  // Click the first roll
  const firstBtn = page.locator("button").filter({ hasText: /inc_/ }).first();
  if (await firstBtn.count()) {
    await firstBtn.click();
    await wait(2000);
  }
  await shot(page, "10-reports");

  // 11) Runbooks
  await page.goto(`${BASE}/runbooks`, { waitUntil: "networkidle" });
  await wait(1500);
  await shot(page, "11-runbooks");

  // 12) Settings
  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
  await wait(1500);
  await shot(page, "12-settings");

  // hero shot: overview alarm, viewport-only (used for README hero)
  await resetAll();
  await setScenario("latency_spike", true, 800);
  await setScenario("error_storm", true, 30);
  await generateTraffic(60);
  await wait(3000);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await wait(3000);
  await page.screenshot({
    path: `${OUT}/00-hero.png`,
    fullPage: false,
    animations: "disabled",
  });
  console.log("✓ 00-hero.png");

  await resetAll();
  await ctx.close();
  await browser.close();
  console.log("done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
