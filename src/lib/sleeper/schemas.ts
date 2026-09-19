import { z } from "zod";

const nullableString = z.string().nullable().optional();

export const sleeperUserSchema = z.object({
  user_id: z.string(),
  username: z.string().nullable().optional(),
  display_name: z.string().nullable(),
  avatar: nullableString,
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const nflStateSchema = z.object({
  week: z.number().int(),
  leg: z.number().int(),
  display_week: z.number().int(),
  season: z.string(),
  season_type: z.string(),
  league_season: z.string(),
});

export const leagueSchema = z.object({
  league_id: z.string(),
  name: z.string(),
  season: z.string(),
  season_type: z.string(),
  status: z.string(),
  total_rosters: z.number().int(),
  avatar: nullableString,
  roster_positions: z.array(z.string()),
  scoring_settings: z.record(z.string(), z.number()),
  settings: z.record(z.string(), z.unknown()),
});

export const rosterSchema = z.object({
  roster_id: z.number().int(),
  owner_id: z.string().nullable(),
  players: z
    .array(z.string())
    .nullable()
    .default([])
    .transform((players) => players ?? []),
  starters: z
    .array(z.string())
    .nullable()
    .default([])
    .transform((starters) => starters ?? []),
  reserve: z.array(z.string()).nullable().optional(),
  taxi: z.array(z.string()).nullable().optional(),
  settings: z.record(z.string(), z.unknown()).nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const matchupSchema = z.object({
  roster_id: z.number().int(),
  matchup_id: z.number().int().nullable(),
  players: z
    .array(z.string())
    .nullable()
    .default([])
    .transform((players) => players ?? []),
  starters: z
    .array(z.string())
    .nullable()
    .default([])
    .transform((starters) => starters ?? []),
  points: z.number().nullable().default(0),
  custom_points: z.number().nullable().optional(),
});

export const playerSchema = z.object({
  player_id: z.string(),
  first_name: nullableString,
  last_name: nullableString,
  full_name: nullableString,
  search_full_name: nullableString,
  position: nullableString,
  fantasy_positions: z.array(z.string()).nullable().optional(),
  team: nullableString,
  status: nullableString,
  active: z.boolean().optional(),
  age: z.number().nullable().optional(),
  injury_status: nullableString,
  injury_body_part: nullableString,
  injury_notes: nullableString,
});

export const playerMapSchema = z.record(z.string(), playerSchema);

export const projectionSchema = z.object({
  player_id: z.string(),
  week: z.number().int(),
  season: z.string(),
  season_type: z.string(),
  opponent: nullableString,
  team: nullableString,
  date: nullableString,
  updated_at: z.number().nullable().optional(),
  last_modified: z.number().nullable().optional(),
  stats: z.record(z.string(), z.number()).default({}),
  player: z
    .object({
      injury_status: nullableString,
      injury_body_part: nullableString,
      injury_notes: nullableString,
    })
    .passthrough()
    .nullable()
    .optional(),
});

export const projectionsSchema = z.array(projectionSchema);

export const trendingPlayerSchema = z.object({
  player_id: z.string(),
  count: z.number(),
});

export const trendingPlayersSchema = z.array(trendingPlayerSchema);

export type SleeperUser = z.infer<typeof sleeperUserSchema>;
export type NflState = z.infer<typeof nflStateSchema>;
export type SleeperLeague = z.infer<typeof leagueSchema>;
export type SleeperRoster = z.infer<typeof rosterSchema>;
export type SleeperMatchup = z.infer<typeof matchupSchema>;
export type SleeperPlayer = z.infer<typeof playerSchema>;
export type SleeperProjection = z.infer<typeof projectionSchema>;
export type TrendingPlayer = z.infer<typeof trendingPlayerSchema>;
