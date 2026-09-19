import "server-only";

import { OpenRouter } from "@openrouter/sdk";
import { z } from "zod";

import { getAppConfig } from "@/lib/config";
import {
  assertGroundedRecommendations,
  type RecommendationPromptInput,
  type RecommendationResponse,
  recommendationResponseSchema,
} from "@/lib/recommendations/schema";

const SYSTEM_PROMPT = `You are a careful NFL fantasy football analyst.
Use only the supplied candidate IDs and facts. Never invent a player, roster,
injury, projection, transaction, or news item. Rank only moves that are
actionable and materially useful. Lineup candidates are verified changes from
the current lineup: the "start" player is currently on the bench and the "sit"
player is currently starting. Use direct imperative language such as
"Start X; bench Y" and never describe two existing starters as a swap. Weigh
weekly projection, recent scoring average, injury designation, matchup, and
48-hour add activity together; explain when those signals disagree. It is valid
to return fewer recommendations or an empty category. Treat every signal as
uncertain, not factual future performance. For trades, explain why the deal
plausibly helps both managers.`;

function textContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        typeof part === "object" &&
        part !== null &&
        "text" in part &&
        typeof part.text === "string"
          ? part.text
          : "",
      )
      .join("");
  }
  throw new Error("OpenRouter returned no text content.");
}

export async function generateRecommendations(
  input: RecommendationPromptInput,
): Promise<RecommendationResponse> {
  const config = getAppConfig();
  const openRouter = new OpenRouter({
    apiKey: config.openRouterApiKey,
    httpReferer: config.appUrl,
    appTitle: "Fantasy Command Center",
  });

  const result = await openRouter.chat.send(
    {
      chatRequest: {
        model: config.openRouterModel,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analyze this grounded matchup candidate set and return JSON only:\n${JSON.stringify(input)}`,
          },
        ],
        maxCompletionTokens: 1800,
        temperature: 0.2,
        provider: { sort: "price" },
        responseFormat: {
          type: "json_schema",
          jsonSchema: {
            name: "fantasy_recommendations",
            description: "Grounded fantasy football recommendations",
            strict: true,
            schema: z.toJSONSchema(recommendationResponseSchema),
          },
        },
      },
    },
    { timeoutMs: 30_000 },
  );

  if ("getReader" in result) {
    throw new Error("OpenRouter unexpectedly returned a stream.");
  }

  const content = textContent(result.choices[0]?.message.content);
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch (error) {
    throw new Error("OpenRouter returned invalid JSON.", { cause: error });
  }

  const response = recommendationResponseSchema.parse(raw);
  return assertGroundedRecommendations(response, input);
}
