import { z } from "zod";

import { isAuthenticated } from "@/lib/auth";
import { getTelegramConfig } from "@/lib/config";
import { buildDashboardBundle } from "@/lib/dashboard/data";
import {
  assertGroundedRecommendations,
  limitRecommendations,
  recommendationResponseSchema,
} from "@/lib/recommendations/schema";
import {
  formatTelegramBriefing,
  sendTelegramBriefing,
} from "@/lib/telegram";

const requestSchema = z.object({
  fingerprint: z.string().min(1),
  generatedAt: z.iso.datetime(),
  recommendations: recommendationResponseSchema,
});

export const maxDuration = 30;

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    return Response.json(
      { error: "Telegram delivery is not configured." },
      { status: 503 },
    );
  }

  try {
    const { view, prompt } = await buildDashboardBundle();
    if (parsed.data.fingerprint !== view.fingerprint) {
      return Response.json(
        {
          error:
            "Sleeper data changed since this dashboard was generated. Refresh the page before sending.",
        },
        { status: 409 },
      );
    }

    const recommendations = limitRecommendations(
      assertGroundedRecommendations(parsed.data.recommendations, prompt),
    );
    const messages = formatTelegramBriefing(
      view,
      recommendations,
      new Date(parsed.data.generatedAt),
    );
    await sendTelegramBriefing(getTelegramConfig(), messages);
    return Response.json({ sent: true });
  } catch (error) {
    console.error("Manual Telegram briefing failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return Response.json(
      { error: "Telegram briefing could not be delivered." },
      { status: 503 },
    );
  }
}
