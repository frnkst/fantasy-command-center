import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000/login",
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      APP_URL: "http://127.0.0.1:3000",
      DASHBOARD_PASSWORD: "test-master-password",
      SLEEPER_USERNAME: "test-user",
      SLEEPER_LEAGUE_ID: "1234567890",
      OPENROUTER_API_KEY: "test-openrouter-key",
      OPENROUTER_MODEL: "google/gemini-2.5-flash-lite",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
