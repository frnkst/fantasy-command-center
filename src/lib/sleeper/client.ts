import "server-only";

import type { z } from "zod";

import {
  leagueSchema,
  matchupSchema,
  nflStateSchema,
  playerMapSchema,
  projectionsSchema,
  rosterSchema,
  sleeperUserSchema,
  type NflState,
  type SleeperLeague,
  type SleeperMatchup,
  type SleeperPlayer,
  type SleeperProjection,
  type SleeperRoster,
  type SleeperUser,
} from "@/lib/sleeper/schemas";

const API_BASE = "https://api.sleeper.app/v1";
const PROJECTIONS_BASE = "https://api.sleeper.com/projections/nfl";
const REQUEST_TIMEOUT_MS = 10_000;

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
  revalidate: number,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate },
      headers: { Accept: "application/json" },
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
  return fetchValidated(`${API_BASE}/state/nfl`, nflStateSchema, 300);
}

export function getSleeperUser(username: string): Promise<SleeperUser> {
  return fetchValidated(
    `${API_BASE}/user/${encodeURIComponent(username)}`,
    sleeperUserSchema,
    3600,
  );
}

export function getLeague(leagueId: string): Promise<SleeperLeague> {
  return fetchValidated(
    `${API_BASE}/league/${encodeURIComponent(leagueId)}`,
    leagueSchema,
    300,
  );
}

export function getLeagueUsers(leagueId: string): Promise<SleeperUser[]> {
  return fetchValidated(
    `${API_BASE}/league/${encodeURIComponent(leagueId)}/users`,
    sleeperUserSchema.array(),
    300,
  );
}

export function getLeagueRosters(leagueId: string): Promise<SleeperRoster[]> {
  return fetchValidated(
    `${API_BASE}/league/${encodeURIComponent(leagueId)}/rosters`,
    rosterSchema.array(),
    120,
  );
}

export function getLeagueMatchups(
  leagueId: string,
  week: number,
): Promise<SleeperMatchup[]> {
  return fetchValidated(
    `${API_BASE}/league/${encodeURIComponent(leagueId)}/matchups/${week}`,
    matchupSchema.array(),
    60,
  );
}

export function getPlayers(): Promise<Record<string, SleeperPlayer>> {
  return fetchValidated(`${API_BASE}/players/nfl`, playerMapSchema, 86_400);
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
    900,
  );
}
