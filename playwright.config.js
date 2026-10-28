import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  timeout: 20000,
  expect: { timeout: 5000 },
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "off",
    screenshot: "off"
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
    { name: "chromium-mobile", use: { ...devices["Pixel 7"], viewport: { width: 412, height: 915 } } }
  ],
  webServer: [
    { command: "npm start", url: "http://127.0.0.1:4173", reuseExistingServer: false, timeout: 15000 },
    { command: "npx vite --host 127.0.0.1 --port 4174 --strictPort", url: "http://127.0.0.1:4174/tests/fixtures/react-canvas.html", reuseExistingServer: true, timeout: 15000 }
  ]
});
