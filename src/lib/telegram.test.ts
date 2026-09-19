import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { DashboardViewData } from "@/lib/dashboard/view-model";
import type { RecommendationResponse } from "@/lib/recommendations/schema";
import {
  formatTelegramBriefing,
  isZurichBriefingHour,
} from "@/lib/telegram";

const player = {
  id: "p1",
  name: "Player & One",
  position: "WR",
  team: "BUF",
  opponent: "MIA",
  projectedPoints: 12,
  recentAverage: 10,
  recentGames: 3,
  addTrendCount: 1,
  dropTrendCount: 0,
  injuryStatus: null,
};

const dashboard: DashboardViewData = {
  fingerprint: "test",
  league: {
    id: "league",
    name: "League <One>",
    season: "2026",
    week: 4,
    scoringLabel: "PPR",
  },
  myTeam: {
    rosterId: 1,
    ownerName: "Owner",
    teamName: "Home",
    projectedPoints: 100,
    starters: [],
  },
  opponent: null,
  projectionUpdatedAt: null,
  model: "model",
  dataSources: [],
  candidates: {
    lineup: [
      {
        id: "lineup",
        start: player,
        sit: { ...player, id: "p2", name: "Player Two", projectedPoints: 8 },
        projectedGain: 4,
      },
    ],
    waivers: [],
    trades: [],
  },
};

const recommendations: RecommendationResponse = {
  summary: "Prefer the higher-volume option.",
  outlook: "toss_up",
  confidence: 70,
  lineup: [
    {
      candidateId: "lineup",
      priority: 1,
      strength: "high",
      confidence: 80,
      rationale: "The projection and recent volume agree.",
      risk: "Late injury news could change the recommendation.",
    },
  ],
  waivers: [],
  trades: [],
  risks: [],
};

describe("Telegram briefing", () => {
  it("follows Zurich daylight-saving time", () => {
    expect(isZurichBriefingHour(new Date("2026-07-01T06:00:00Z"))).toBe(true);
    expect(isZurichBriefingHour(new Date("2026-12-01T07:00:00Z"))).toBe(true);
    expect(isZurichBriefingHour(new Date("2026-07-01T07:00:00Z"))).toBe(false);
  });

  it("formats the summary first and escapes Telegram HTML", () => {
    const [summary, moves] = formatTelegramBriefing(
      dashboard,
      recommendations,
      new Date("2026-07-01T06:00:00Z"),
    );

    expect(summary).toContain("<b>The analyst's read</b>");
    expect(summary).toContain("League &lt;One&gt;");
    expect(moves).toContain("<b>1. Lineup: Start Player &amp; One");
    expect(moves).toContain("+4.0 projected pts · High confidence");
  });
});
