import { describe, expect, it } from "vitest";

import {
  applyCompletedGamePoints,
  type PlayerView,
} from "@/lib/dashboard/view-model";

const player = (
  id: string,
  team: string,
  projectedPoints: number,
): PlayerView => ({
  id,
  name: id,
  position: "WR",
  team,
  opponent: null,
  projectedPoints,
  recentAverage: null,
  recentGames: 0,
  addTrendCount: 0,
  dropTrendCount: 0,
  injuryStatus: null,
});

describe("live matchup projections", () => {
  it("uses actual points for completed games and projections for remaining games", () => {
    const result = applyCompletedGamePoints(
      [player("played", "DET", 11.2), player("upcoming", "DAL", 19.5)],
      new Set(["DET", "BUF"]),
      { played: 17.2 },
    );

    expect(result.map(({ projectedPoints }) => projectedPoints)).toEqual([
      17.2, 19.5,
    ]);
  });

  it("uses zero for a completed player with no recorded points", () => {
    const [result] = applyCompletedGamePoints(
      [player("inactive", "DET", 8.4)],
      new Set(["DET"]),
      {},
    );

    expect(result.projectedPoints).toBe(0);
  });
});
