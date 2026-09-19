import { describe, expect, it } from "vitest";

import {
  leagueSchema,
  matchupSchema,
  playerMapSchema,
  projectionSchema,
  rosterSchema,
  sleeperUserSchema,
  trendingPlayersSchema,
} from "@/lib/sleeper/schemas";

describe("Sleeper schemas", () => {
  it("normalizes nullable roster arrays", () => {
    const roster = rosterSchema.parse({
      roster_id: 3,
      owner_id: "owner",
      players: null,
      starters: null,
      settings: {},
    });

    expect(roster.players).toEqual([]);
    expect(roster.starters).toEqual([]);
  });

  it("accepts league scoring settings", () => {
    const league = leagueSchema.parse({
      league_id: "123",
      name: "Test League",
      season: "2026",
      season_type: "regular",
      status: "in_season",
      total_rosters: 10,
      roster_positions: ["QB", "RB", "WR", "FLEX", "BN"],
      scoring_settings: { pass_yd: 0.04, rec: 1 },
      settings: {},
    });

    expect(league.scoring_settings.rec).toBe(1);
  });

  it("accepts the player map and undocumented projection shape", () => {
    const player = {
      player_id: "p1",
      first_name: "A",
      last_name: "Player",
      position: "WR",
      fantasy_positions: ["WR"],
      team: "GB",
    };

    expect(playerMapSchema.parse({ p1: player }).p1.position).toBe("WR");
    expect(
      projectionSchema.parse({
        player_id: "p1",
        week: 2,
        season: "2026",
        season_type: "regular",
        stats: { rec: 5, rec_yd: 70 },
      }).stats.rec,
    ).toBe(5);
  });

  it("accepts league members without a username", () => {
    const member = sleeperUserSchema.parse({
      user_id: "member-1",
      display_name: "League Member",
      avatar: null,
      metadata: { team_name: "The Team" },
    });

    expect(member.username).toBeUndefined();
    expect(member.display_name).toBe("League Member");
  });

  it("accepts player add trends", () => {
    expect(
      trendingPlayersSchema.parse([{ player_id: "p1", count: 142 }]),
    ).toEqual([{ player_id: "p1", count: 142 }]);
  });

  it("accepts live player points in a matchup", () => {
    const matchup = matchupSchema.parse({
      roster_id: 1,
      matchup_id: 2,
      players: ["p1"],
      starters: ["p1"],
      points: 17.2,
      players_points: { p1: 17.2 },
    });

    expect(matchup.players_points).toEqual({ p1: 17.2 });
  });
});
