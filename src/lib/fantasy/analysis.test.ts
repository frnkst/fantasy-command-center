import { describe, expect, it } from "vitest";

import {
  calculateProjectedPoints,
  findBalancedTradeCandidates,
  findStartSitSwaps,
  isEligibleForSlot,
  optimizeLineup,
  shortlistWaiverCandidates,
  stableFingerprint,
} from "./analysis";
import type { AnalysisPlayer } from "./types";

const player = (
  playerId: string,
  position: string,
  projectedPoints: number,
  injuryStatus?: string,
): AnalysisPlayer => ({ playerId, position, projectedPoints, injuryStatus });

describe("slot eligibility", () => {
  it("supports offensive, kicker, defense, flex, superflex, and IDP slots", () => {
    expect(isEligibleForSlot(player("qb", "QB", 1), "SUPER_FLEX")).toBe(true);
    expect(isEligibleForSlot(player("rb", "RB", 1), "WRRB_FLEX")).toBe(true);
    expect(isEligibleForSlot(player("te", "TE", 1), "REC_FLEX")).toBe(true);
    expect(isEligibleForSlot(player("te", "TE", 1), "WRRB_FLEX")).toBe(false);
    expect(isEligibleForSlot(player("k", "K", 1), "K")).toBe(true);
    expect(isEligibleForSlot(player("d", "DST", 1), "DEF")).toBe(true);
    expect(isEligibleForSlot(player("lb", "LB", 1), "IDP_FLEX")).toBe(true);
  });

  it("never treats reserve slots as startable", () => {
    for (const slot of ["BN", "IR", "TAXI"]) {
      expect(isEligibleForSlot(player("rb", "RB", 1), slot)).toBe(false);
    }
  });
});

describe("projection scoring", () => {
  it("sums generic matching stat keys and ignores unmatched fields", () => {
    expect(
      calculateProjectedPoints(
        { pass_yd: 300, pass_td: 2, rush_yd: 20, unknown: 99 },
        { pass_yd: 0.04, pass_td: 4, rush_yd: 0.1 },
      ),
    ).toBe(22);
  });

  it("uses fallback points only when no input matched", () => {
    expect(calculateProjectedPoints({ pts_ppr: 14.5 }, { rec: 1 })).toBe(14.5);
    expect(
      calculateProjectedPoints({ rec: 2, pts_ppr: 14.5 }, { rec: 1 }),
    ).toBe(2);
    expect(calculateProjectedPoints({}, {}, { fallbackPoints: 7 })).toBe(7);
  });
});

describe("lineup optimization", () => {
  it("uses ordered legal slots without reusing a player", () => {
    const result = optimizeLineup(
      [
        player("elite-wr", "WR", 20),
        player("wr", "WR", 10),
        player("rb", "RB", 15),
        player("bench", "RB", 4),
      ],
      ["WR", "RB", "FLEX", "BN", "IR"],
    );
    expect(result.entries.map((entry) => entry.player?.playerId)).toEqual([
      "elite-wr",
      "rb",
      "wr",
    ]);
    result.entries.forEach(({ player: starter, slot }) => {
      expect(starter && isEligibleForSlot(starter, slot)).toBe(true);
    });
    expect(result.totalProjectedPoints).toBe(45);
    expect(result.bench.map(({ playerId }) => playerId)).toEqual(["bench"]);
  });

  it("returns actionable start/sit differences", () => {
    const roster = [player("low", "RB", 4), player("high", "RB", 12)];
    expect(findStartSitSwaps(roster, ["RB"], ["low"])).toMatchObject([
      { start: { playerId: "high" }, sit: { playerId: "low" }, projectedGain: 8 },
    ]);
  });

  it("does not report swaps when existing starters only relocate slots", () => {
    const breeceHall = player("breece-hall", "RB", 18);
    const javonteWilliams = player("javonte-williams", "RB", 14);
    const roster = [breeceHall, javonteWilliams, player("bench-rb", "RB", 5)];

    const optimized = optimizeLineup(roster, ["RB", "FLEX"]);
    expect(optimized.entries.map(({ player: starter }) => starter?.playerId)).toEqual([
      "breece-hall",
      "javonte-williams",
    ]);

    expect(
      findStartSitSwaps(
        roster,
        ["RB", "FLEX"],
        ["javonte-williams", "breece-hall"],
      ),
    ).toEqual([]);
  });
});

describe("waiver candidates", () => {
  it("filters injuries and owned players, verifies lineup gain, and caps output", () => {
    const roster = [player("rb1", "RB", 10), player("wr1", "WR", 5)];
    const result = shortlistWaiverCandidates(
      [
        player("rb1", "RB", 30),
        player("hurt", "WR", 30, "Out"),
        player("upgrade", "WR", 12),
        player("small", "WR", 6),
      ],
      roster,
      ["RB", "WR"],
      { limit: 1 },
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      add: { playerId: "upgrade" },
      drop: { playerId: "wr1" },
      lineupGain: 7,
    });
  });
});

describe("trade candidates", () => {
  it("returns only legal swaps improving both position-needy teams", () => {
    const teamA = [
      player("a-qb", "QB", 20),
      player("a-rb", "RB", 4),
      player("a-spare-qb", "QB", 15),
    ];
    const teamB = [
      player("b-qb", "QB", 5),
      player("b-rb", "RB", 18),
      player("b-spare-rb", "RB", 14),
    ];
    const result = findBalancedTradeCandidates(teamA, teamB, ["QB", "RB"], {
      limit: 1,
      maximumProjectionDifference: 2,
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      teamAGives: { playerId: "a-spare-qb" },
      teamBGives: { playerId: "b-spare-rb" },
      teamAImprovement: 10,
      teamBImprovement: 10,
    });
  });
});

describe("stable fingerprint", () => {
  it("is stable across object key order and changes with input", () => {
    expect(stableFingerprint({ b: 2, a: 1 })).toBe(
      stableFingerprint({ a: 1, b: 2 }),
    );
    expect(stableFingerprint({ a: 2 })).not.toBe(stableFingerprint({ a: 1 }));
  });
});
