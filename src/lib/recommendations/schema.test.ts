import { describe, expect, it } from "vitest";

import {
  assertGroundedRecommendations,
  type RecommendationPromptInput,
  recommendationResponseSchema,
} from "@/lib/recommendations/schema";

const input: RecommendationPromptInput = {
  context: {
    leagueName: "League",
    season: "2026",
    week: 4,
    scoringSummary: "PPR",
    myTeamName: "Home",
    opponentName: "Away",
    myProjectedPoints: 110,
    opponentProjectedPoints: 108,
    projectionUpdatedAt: 1,
  },
  lineupCandidates: [{ id: "lineup:a:b" }],
  waiverCandidates: [{ id: "waiver:a:b" }],
  tradeCandidates: [{ id: "trade:a:b" }],
};

const response = recommendationResponseSchema.parse({
  summary: "A close matchup.",
  outlook: "toss_up",
  confidence: 62,
  lineup: [
    {
      candidateId: "lineup:a:b",
      priority: 1,
      strength: "high",
      confidence: 70,
      rationale: "A has the stronger projection.",
      risk: "Projection uncertainty.",
    },
  ],
  waivers: [],
  trades: [],
  risks: ["Late injury news is not included."],
});

describe("recommendation grounding", () => {
  it("requires a strength rating on every recommendation", () => {
    const withoutStrength = {
      ...response,
      lineup: [
        {
          candidateId: "lineup:a:b",
          priority: 1,
          confidence: 70,
          rationale: "A has the stronger projection.",
          risk: "Projection uncertainty.",
        },
      ],
    };

    expect(recommendationResponseSchema.safeParse(withoutStrength).success).toBe(
      false,
    );
  });

  it("accepts known candidate IDs", () => {
    expect(assertGroundedRecommendations(response, input)).toEqual(response);
  });

  it("rejects invented candidate IDs", () => {
    expect(() =>
      assertGroundedRecommendations(
        {
          ...response,
          lineup: [{ ...response.lineup[0], candidateId: "invented" }],
        },
        input,
      ),
    ).toThrow(/unknown lineup candidate/);
  });
});
