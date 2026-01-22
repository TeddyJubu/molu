import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3004",
    trace: "on-first-retry"
  },
  webServer: {
    command: "node scripts/e2e-start.mjs",
    url: "http://localhost:3004",
    reuseExistingServer: false,
    timeout: 240_000
  }
});
