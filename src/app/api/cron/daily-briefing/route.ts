import { timingSafeEqual } from "node:crypto";

import { getTelegramConfig } from "@/lib/config";
import { buildDashboardBundle } from "@/lib/dashboard/data";
import { generateRecommendations } from "@/lib/recommendations/openrouter";
import {
  formatTelegramBriefing,
  isZurichBriefingHour,
  sendTelegramBriefing,
} from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || !authorization) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authorization);
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const now = new Date();
  const forced = url.searchParams.get("force") === "1";
  if (!forced && !isZurichBriefingHour(now)) {
    return Response.json({
      sent: false,
      reason: "Outside the 08:00 Europe/Zurich delivery window.",
    });
  }

  try {
    const { view, prompt } = await buildDashboardBundle();
    const recommendations = await generateRecommendations(prompt);
    const messages = formatTelegramBriefing(view, recommendations, now);
    await sendTelegramBriefing(getTelegramConfig(), messages);
    return Response.json({
      sent: true,
      recommendations:
        recommendations.lineup.length +
        recommendations.waivers.length +
        recommendations.trades.length,
    });
  } catch (error) {
    console.error("Daily Telegram briefing failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return Response.json(
      { error: "Daily briefing could not be delivered." },
      { status: 503 },
    );
  }
}
