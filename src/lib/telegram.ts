import type { DashboardViewData } from "@/lib/dashboard/view-model";
import type { TelegramConfig } from "@/lib/config";
import type { RecommendationResponse } from "@/lib/recommendations/schema";

const TELEGRAM_MESSAGE_LIMIT = 4096;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function shortened(value: string, maximum: number) {
  if (value.length <= maximum) return value;
  return `${value.slice(0, maximum - 1).trimEnd()}…`;
}

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function isZurichBriefingHour(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Zurich",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return parts.find(({ type }) => type === "hour")?.value === "08";
}

export function formatTelegramBriefing(
  dashboard: DashboardViewData,
  recommendations: RecommendationResponse,
  generatedAt: Date,
) {
  const summary = [
    "🏈 <b>The analyst's read</b>",
    "",
    `<b>${escapeHtml(dashboard.league.name)}</b> · Week ${dashboard.league.week}`,
    `${titleCase(recommendations.outlook)} outlook`,
    "",
    escapeHtml(recommendations.summary),
    "",
    `<i>Generated ${escapeHtml(generatedAt.toLocaleString("en-GB", {
      timeZone: "Europe/Zurich",
      dateStyle: "medium",
      timeStyle: "short",
    }))} · Europe/Zurich</i>`,
  ].join("\n");

  const lineup = new Map(
    dashboard.candidates.lineup.map((candidate) => [candidate.id, candidate]),
  );
  const waivers = new Map(
    dashboard.candidates.waivers.map((candidate) => [candidate.id, candidate]),
  );
  const trades = new Map(
    dashboard.candidates.trades.map((candidate) => [candidate.id, candidate]),
  );
  const ranked = [
    ...recommendations.lineup.flatMap((advice) => {
      const candidate = lineup.get(advice.candidateId);
      return candidate
        ? [{
            advice,
            label: "Lineup",
            move: `Start ${candidate.start.name}; bench ${candidate.sit.name}`,
            gain: candidate.projectedGain,
          }]
        : [];
    }),
    ...recommendations.waivers.flatMap((advice) => {
      const candidate = waivers.get(advice.candidateId);
      return candidate
        ? [{
            advice,
            label: "Waiver",
            move: `Add ${candidate.add.name}; drop ${candidate.drop.name}`,
            gain: candidate.projectedGain,
          }]
        : [];
    }),
    ...recommendations.trades.flatMap((advice) => {
      const candidate = trades.get(advice.candidateId);
      return candidate
        ? [{
            advice,
            label: "Trade",
            move: `Offer ${candidate.give.name} for ${candidate.receive.name}`,
            gain: candidate.myProjectedGain,
          }]
        : [];
    }),
  ]
    .sort(
      (a, b) =>
        a.advice.priority - b.advice.priority ||
        b.advice.confidence - a.advice.confidence,
    )
    .slice(0, 5);

  const moves = ranked.length
    ? ranked.map(
        ({ advice, label, move, gain }, index) =>
          [
            `<b>${index + 1}. ${label}: ${escapeHtml(move)}</b>`,
            `+${gain.toFixed(1)} projected pts · ${titleCase(advice.strength)} confidence`,
            escapeHtml(shortened(advice.rationale, 240)),
            `⚠️ ${escapeHtml(shortened(advice.risk, 140))}`,
          ].join("\n"),
      )
    : ["No material lineup, waiver, or trade change is recommended today."];

  const decisions = [
    "🎯 <b>Next best moves</b>",
    "",
    ...moves.flatMap((move, index) => (index ? ["", move] : [move])),
    "",
    "<i>Verify late injuries and complete every transaction in Sleeper.</i>",
  ].join("\n");

  if (summary.length > TELEGRAM_MESSAGE_LIMIT || decisions.length > TELEGRAM_MESSAGE_LIMIT) {
    throw new Error("Telegram briefing exceeds the message length limit.");
  }
  return [summary, decisions] as const;
}

export async function sendTelegramBriefing(
  config: TelegramConfig,
  messages: readonly string[],
) {
  const endpoint = `https://api.telegram.org/bot${config.botToken}/sendMessage`;

  for (const text of messages) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `Telegram send failed with ${response.status}: ${shortened(detail, 240)}`,
      );
    }
  }
}
