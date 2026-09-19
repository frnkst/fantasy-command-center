import { z } from "zod";

const recommendationBaseSchema = z.object({
  candidateId: z.string().min(1),
  priority: z.number().int().min(1).max(5),
  confidence: z.number().int().min(0).max(100),
  rationale: z.string().min(1).max(500),
  risk: z.string().min(1).max(300),
});

export const recommendationResponseSchema = z.object({
  summary: z.string().min(1).max(800),
  outlook: z.enum(["favored", "underdog", "toss_up"]),
  confidence: z.number().int().min(0).max(100),
  lineup: z.array(recommendationBaseSchema).max(5),
  waivers: z.array(recommendationBaseSchema).max(5),
  trades: z.array(recommendationBaseSchema).max(5),
  risks: z.array(z.string().min(1).max(300)).max(6),
});

export type RecommendationResponse = z.infer<
  typeof recommendationResponseSchema
>;

export type RecommendationPromptInput = {
  context: {
    leagueName: string;
    season: string;
    week: number;
    scoringSummary: string;
    myTeamName: string;
    opponentName: string | null;
    myProjectedPoints: number;
    opponentProjectedPoints: number | null;
    projectionUpdatedAt: number | null;
  };
  lineupCandidates: Array<Record<string, unknown> & { id: string }>;
  waiverCandidates: Array<Record<string, unknown> & { id: string }>;
  tradeCandidates: Array<Record<string, unknown> & { id: string }>;
};

export function assertGroundedRecommendations(
  response: RecommendationResponse,
  input: RecommendationPromptInput,
): RecommendationResponse {
  const allowed = {
    lineup: new Set(input.lineupCandidates.map((candidate) => candidate.id)),
    waivers: new Set(input.waiverCandidates.map((candidate) => candidate.id)),
    trades: new Set(input.tradeCandidates.map((candidate) => candidate.id)),
  };

  for (const category of ["lineup", "waivers", "trades"] as const) {
    for (const item of response[category]) {
      if (!allowed[category].has(item.candidateId)) {
        throw new Error(
          `AI returned unknown ${category} candidate ${item.candidateId}.`,
        );
      }
    }
  }

  return response;
}
