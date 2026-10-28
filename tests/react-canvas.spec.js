import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:4174/tests/fixtures/react-canvas.html");
  await expect(page.locator('[aria-label="Responsive circuit"]')).toBeVisible();
  await expect(page.locator('[aria-label="Fixed circuit"]')).toBeVisible();
});

test("responsive SVG viewBox tracks parent resize, including non-window layout changes", async ({ page }) => {
  const parent = page.locator("#parent");
  const svg = parent.locator("svg");
  const initialWidth = await parent.evaluate(element => element.getBoundingClientRect().width);
  await expect(svg).toHaveAttribute("viewBox", `0 0 ${Math.round(initialWidth)} ${Math.round(initialWidth / (16 / 9))}`);
  await parent.evaluate(element => { element.style.width = "300px"; });
  await expect(svg).toHaveAttribute("viewBox", "0 0 300 169");
  await expect(parent).toHaveCSS("width", "300px");
});

test("fixed dimensions remain fixed while the browser viewport changes", async ({ page }) => {
  const svg = page.locator('#fixed svg');
  await expect(svg).toHaveAttribute("viewBox", "0 0 320 180");
  await page.setViewportSize({ width: 360, height: 800 });
  await expect(svg).toHaveAttribute("viewBox", "0 0 320 180");
  await expect(page.locator('#fixed [data-circuit-canvas="true"]')).toHaveCSS("width", "320px");
});

test("auto canvas initializes after a hidden container becomes visible", async ({ page }) => {
  await page.locator("#parent").evaluate(element => { element.style.display = "none"; });
  await page.waitForTimeout(100);
  await page.locator("#parent").evaluate(element => { element.style.display = "block"; element.style.maxWidth = "none"; element.style.width = "600px"; });
  await expect(page.locator('#parent svg')).toHaveAttribute("viewBox", "0 0 600 338");
});
