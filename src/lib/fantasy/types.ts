export const STARTABLE_ROSTER_SLOTS = [
  "QB",
  "RB",
  "WR",
  "TE",
  "K",
  "DEF",
  "FLEX",
  "WRRB_FLEX",
  "REC_FLEX",
  "SUPER_FLEX",
  "IDP_FLEX",
] as const;

export const EXCLUDED_ROSTER_SLOTS = ["BN", "IR", "TAXI"] as const;

export type StartableRosterSlot = (typeof STARTABLE_ROSTER_SLOTS)[number];
export type ExcludedRosterSlot = (typeof EXCLUDED_ROSTER_SLOTS)[number];
export type RosterSlot = StartableRosterSlot | ExcludedRosterSlot | string;
export type ProjectionStats = Record<string, number>;
export type ScoringSettings = Record<string, number>;

export interface AnalysisPlayer {
  playerId: string;
  position: string | null;
  fantasyPositions?: readonly string[] | null;
  projectedPoints: number;
  injuryStatus?: string | null;
}

export interface LineupEntry {
  slot: string;
  slotIndex: number;
  player: AnalysisPlayer | null;
}

export interface OptimizedLineup {
  entries: LineupEntry[];
  starters: AnalysisPlayer[];
  bench: AnalysisPlayer[];
  totalProjectedPoints: number;
}

export interface StartSitSwap {
  slot: string;
  slotIndex: number;
  start: AnalysisPlayer;
  sit: AnalysisPlayer | null;
  projectedGain: number;
}

export interface ScoringOptions {
  fallbackPoints?: number;
  fallbackStatKeys?: readonly string[];
}

export interface CandidateOptions {
  limit?: number;
  minimumGain?: number;
  unavailableInjuryStatuses?: readonly string[];
}

export interface WaiverCandidate {
  add: AnalysisPlayer;
  drop: AnalysisPlayer | null;
  projectedGain: number;
  lineupGain: number;
}

export interface TradeCandidate {
  teamAGives: AnalysisPlayer;
  teamBGives: AnalysisPlayer;
  teamAImprovement: number;
  teamBImprovement: number;
  balanceDifference: number;
}

export interface TradeOptions extends CandidateOptions {
  maximumProjectionDifference?: number;
}

