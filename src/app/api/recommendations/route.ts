import { z } from "zod";

import { isAuthenticated } from "@/lib/auth";
import { buildDashboardBundle } from "@/lib/dashboard/data";
import { generateRecommendations } from "@/lib/recommendations/openrouter";

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
    return Response.json({
      fingerprint: view.fingerprint,
      generatedAt: new Date().toISOString(),
      model: view.model,
      recommendations,
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
