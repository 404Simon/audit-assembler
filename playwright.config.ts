import { defineConfig, devices } from "@playwright/test"

/**
 * End-to-end tests run against the deployed static site by default.
 * Override with AUDIT_E2E_BASE_URL when checking a preview deployment.
 */
const baseURL =
  process.env.AUDIT_E2E_BASE_URL ??
  "https://404simon.github.io/audit-assembler/"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  // A real end-to-end run should fail loudly rather than hide flakiness.
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 180_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1440, height: 1000 },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
})
