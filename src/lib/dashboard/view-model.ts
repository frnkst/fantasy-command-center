export type PlayerView = {
  id: string;
  name: string;
  position: string;
  team: string;
  opponent: string | null;
  projectedPoints: number;
  recentAverage: number | null;
  recentGames: number;
  addTrendCount: number;
  dropTrendCount: number;
  injuryStatus: string | null;
};

export type TeamView = {
  rosterId: number;
  ownerName: string;
  teamName: string;
  projectedPoints: number;
  starters: PlayerView[];
};

export type LineupCandidateView = {
  id: string;
  start: PlayerView;
  sit: PlayerView;
  projectedGain: number;
};

export type WaiverCandidateView = {
  id: string;
  add: PlayerView;
  drop: PlayerView;
  projectedGain: number;
};

export type TradeCandidateView = {
  id: string;
  give: PlayerView;
  receive: PlayerView;
  partnerName: string;
  myProjectedGain: number;
  partnerProjectedGain: number;
};

export type DashboardViewData = {
  fingerprint: string;
  league: {
    id: string;
    name: string;
    season: string;
    week: number;
    scoringLabel: string;
  };
  myTeam: TeamView;
  opponent: TeamView | null;
  projectionUpdatedAt: number | null;
  model: string;
  dataSources: string[];
  candidates: {
    lineup: LineupCandidateView[];
    waivers: WaiverCandidateView[];
    trades: TradeCandidateView[];
  };
};

export function applyCompletedGamePoints(
  players: readonly PlayerView[],
  completedTeams: ReadonlySet<string>,
  actualPoints: Readonly<Record<string, number>>,
): PlayerView[] {
  return players.map((player) =>
    completedTeams.has(player.team)
      ? {
          ...player,
          projectedPoints: Object.hasOwn(actualPoints, player.id)
            ? actualPoints[player.id]
            : 0,
        }
      : player,
  );
}
