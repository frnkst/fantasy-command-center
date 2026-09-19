import { z } from "zod";

import { isAuthenticated } from "@/lib/auth";
import { getTelegramConfig } from "@/lib/config";
import { buildDashboardBundle } from "@/lib/dashboard/data";
import { generateRecommendations } from "@/lib/recommendations/openrouter";
import {
  formatTelegramBriefing,
  sendTelegramBriefing,
} from "@/lib/telegram";

const requestSchema = z.object({
  fingerprint: z.string().min(1),
});

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

  try {
    const { view, prompt } = await buildDashboardBundle();
    if (parsed.data.fingerprint !== view.fingerprint) {
      return Response.json(
        {
          error:
            "Sleeper data changed since this page loaded. Refresh before generating.",
        },
        { status: 409 },
      );
    }

    const recommendations = await generateRecommendations(prompt);
    const generatedAt = new Date();
    let telegram: "sent" | "not_configured" | "failed";
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
      telegram = "not_configured";
    } else {
      try {
        const messages = formatTelegramBriefing(
          view,
          recommendations,
          generatedAt,
        );
        await sendTelegramBriefing(getTelegramConfig(), messages);
        telegram = "sent";
      } catch (telegramError) {
        telegram = "failed";
        console.error("Dashboard Telegram briefing failed", {
          message:
            telegramError instanceof Error
              ? telegramError.message
              : String(telegramError),
        });
      }
    }

    return Response.json({
      fingerprint: view.fingerprint,
      generatedAt: generatedAt.toISOString(),
      model: view.model,
      recommendations,
      telegram: { status: telegram },
    });
  } catch (error) {
    console.error("Recommendation generation failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return Response.json(
      {
        error:
          "Recommendation service is temporarily unavailable. No usage was cached.",
      },
      { status: 503 },
    );
  }
}
