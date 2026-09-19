import "server-only";

import type { z } from "zod";

import {
  leagueSchema,
  matchupSchema,
  nflStateSchema,
  playerMapSchema,
  projectionsSchema,
  rosterSchema,
  scheduleSchema,
  sleeperUserSchema,
  trendingPlayersSchema,
  type NflState,
  type SleeperLeague,
  type SleeperMatchup,
  type SleeperPlayer,
  type SleeperProjection,
  type SleeperRoster,
  type SleeperScheduleGame,
  type SleeperUser,
  type TrendingPlayer,
} from "@/lib/sleeper/schemas";

const API_BASE = "https://api.sleeper.app/v1";
const PROJECTIONS_BASE = "https://api.sleeper.com/projections/nfl";
const REQUEST_TIMEOUT_MS = 10_000;
type CachePolicy = "fresh" | { revalidate: number };

export class SleeperApiError extends Error {
  constructor(
    message: string,
    public readonly endpoint: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "SleeperApiError";
  }
}

async function fetchValidated<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  cachePolicy: CachePolicy,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      ...(cachePolicy === "fresh"
        ? { cache: "no-store" as const }
        : { next: { revalidate: cachePolicy.revalidate } }),
      headers: {
        Accept: "application/json",
        ...(cachePolicy === "fresh"
          ? { "Cache-Control": "no-cache", Pragma: "no-cache" }
          : {}),
      },
    });
  } catch (error) {
    throw new SleeperApiError("Sleeper did not respond in time.", endpoint, {
      cause: error,
    });
  }

  if (!response.ok) {
    throw new SleeperApiError(
      `Sleeper returned HTTP ${response.status}.`,
      endpoint,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    throw new SleeperApiError("Sleeper returned invalid JSON.", endpoint, {
      cause: error,
    });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    console.error("Sleeper response validation failed", {
      endpoint,
      issues: parsed.error.issues.slice(0, 8),
    });
    throw new SleeperApiError(
      "Sleeper returned an unexpected response shape.",
      endpoint,
      { cause: parsed.error },
    );
  }
  return parsed.data;
}

export function getNflState(): Promise<NflState> {
  return fetchValidated(`${API_BASE}/state/nfl`, nflStateSchema, "fresh");
}

export function getSleeperUser(username: string): Promise<SleeperUser> {
  return fetchValidated(
    `${API_BASE}/user/${encodeURIComponent(username)}`,
    sleeperUserSchema,
    "fresh",
  );
}

export function getLeague(leagueId: string): Promise<SleeperLeague> {
  return fetchValidated(
    `${API_BASE}/league/${encodeURIComponent(leagueId)}`,
    leagueSchema,
    "fresh",
  );
}

export function getLeagueUsers(leagueId: string): Promise<SleeperUser[]> {
  return fetchValidated(
    `${API_BASE}/league/${encodeURIComponent(leagueId)}/users`,
    sleeperUserSchema.array(),
    "fresh",
  );
}

export function getLeagueRosters(leagueId: string): Promise<SleeperRoster[]> {
  return fetchValidated(
    `${API_BASE}/league/${encodeURIComponent(leagueId)}/rosters`,
    rosterSchema.array(),
    "fresh",
  );
}

export function getLeagueMatchups(
  leagueId: string,
  week: number,
): Promise<SleeperMatchup[]> {
  return fetchValidated(
    `${API_BASE}/league/${encodeURIComponent(leagueId)}/matchups/${week}`,
    matchupSchema.array(),
    "fresh",
  );
}

export function getPlayers(): Promise<Record<string, SleeperPlayer>> {
  return fetchValidated(
    `${API_BASE}/players/nfl`,
    playerMapSchema,
    { revalidate: 86_400 },
  );
}

export function getNflSchedule(
  season: string,
  seasonType: string,
): Promise<SleeperScheduleGame[]> {
  return fetchValidated(
    `https://api.sleeper.com/schedule/nfl/${encodeURIComponent(seasonType)}/${encodeURIComponent(season)}`,
    scheduleSchema,
    "fresh",
  );
}

export function getWeeklyProjections(
  season: string,
  week: number,
  seasonType: string,
): Promise<SleeperProjection[]> {
  const query = new URLSearchParams({ season_type: seasonType });
  return fetchValidated(
    `${PROJECTIONS_BASE}/${encodeURIComponent(season)}/${week}?${query}`,
    projectionsSchema,
    "fresh",
  );
}

export function getWeeklyStats(
  season: string,
  week: number,
  seasonType: string,
): Promise<SleeperProjection[]> {
  const query = new URLSearchParams({ season_type: seasonType });
  return fetchValidated(
    `https://api.sleeper.com/stats/nfl/${encodeURIComponent(season)}/${week}?${query}`,
    projectionsSchema,
    "fresh",
  );
}

export function getTrendingPlayers(
  type: "add" | "drop",
): Promise<TrendingPlayer[]> {
  return fetchValidated(
    `${API_BASE}/players/nfl/trending/${type}?lookback_hours=48&limit=100`,
    trendingPlayersSchema,
    "fresh",
  );
}
