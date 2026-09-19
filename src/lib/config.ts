import "server-only";

import { z } from "zod";

const environmentSchema = z.object({
  APP_URL: z.url(),
  DASHBOARD_PASSWORD: z.string().min(12),
  SLEEPER_USERNAME: z.string().trim().min(1),
  SLEEPER_LEAGUE_ID: z.string().regex(/^\d+$/),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_MODEL: z.string().trim().min(1).default("google/gemini-2.5-flash-lite"),
});

export type AppConfig = {
  appUrl: string;
  dashboardPassword: string;
  sleeperUsername: string;
  sleeperLeagueId: string;
  openRouterApiKey: string;
  openRouterModel: string;
};

let cachedConfig: AppConfig | undefined;

export function getAppConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const parsed = environmentSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid application environment: ${details}`);
  }

  cachedConfig = {
    appUrl: parsed.data.APP_URL.replace(/\/$/, ""),
    dashboardPassword: parsed.data.DASHBOARD_PASSWORD,
    sleeperUsername: parsed.data.SLEEPER_USERNAME,
    sleeperLeagueId: parsed.data.SLEEPER_LEAGUE_ID,
    openRouterApiKey: parsed.data.OPENROUTER_API_KEY,
    openRouterModel: parsed.data.OPENROUTER_MODEL,
  };

  return cachedConfig;
}

export function resetConfigForTests() {
  cachedConfig = undefined;
}
