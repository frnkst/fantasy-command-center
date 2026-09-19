import "server-only";

import { getAppConfig } from "@/lib/config";
import {
  calculateProjectedPoints,
  findBalancedTradeCandidates,
  findStartSitSwaps,
  optimizeLineup,
  shortlistWaiverCandidates,
  stableFingerprint,
} from "@/lib/fantasy/analysis";
import type { AnalysisPlayer } from "@/lib/fantasy/types";
import type {
  DashboardViewData,
  LineupCandidateView,
  PlayerView,
  TeamView,
  TradeCandidateView,
  WaiverCandidateView,
} from "@/lib/dashboard/view-model";
import type { RecommendationPromptInput } from "@/lib/recommendations/schema";
import {
  getLeague,
  getLeagueMatchups,
  getLeagueRosters,
  getLeagueUsers,
  getNflState,
  getPlayers,
  getSleeperUser,
  getTrendingPlayers,
  getWeeklyProjections,
  getWeeklyStats,
} from "@/lib/sleeper/client";
import type {
  SleeperPlayer,
  SleeperProjection,
  SleeperRoster,
  SleeperUser,
} from "@/lib/sleeper/schemas";

const ROSTERABLE_POSITIONS = new Set([
  "QB",
  "RB",
  "WR",
  "TE",
  "K",
  "DEF",
  "DL",
  "LB",
  "DB",
]);

export class DashboardDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DashboardDataError";
  }
}

export type DashboardBundle = {
  view: DashboardViewData;
  prompt: RecommendationPromptInput;
};

function playerName(player: SleeperPlayer | undefined, playerId: string) {
  if (!player) return playerId;
  return (
    player.full_name ??
    [player.first_name, player.last_name].filter(Boolean).join(" ") ??
    playerId
  );
}

function fallbackProjection(
  projection: SleeperProjection | undefined,
  receptionPoints: number,
) {
  if (!projection) return 0;
  if (receptionPoints >= 0.75) return projection.stats.pts_ppr ?? 0;
  if (receptionPoints >= 0.25) return projection.stats.pts_half_ppr ?? 0;
  return projection.stats.pts_std ?? 0;
}

function teamName(user: SleeperUser | undefined, rosterId: number) {
  const configured =
    user?.metadata && typeof user.metadata.team_name === "string"
      ? user.metadata.team_name
      : null;
  return configured || user?.display_name || user?.username || `Roster ${rosterId}`;
}

function scoringLabel(scoring: Record<string, number>) {
  const reception = scoring.rec ?? 0;
  if (reception >= 1) return "Full PPR";
  if (reception >= 0.5) return "Half PPR";
  return "Standard";
}

function promptPlayer(player: PlayerView) {
  return {
    playerId: player.id,
    name: player.name,
    position: player.position,
    team: player.team,
    opponent: player.opponent,
    projectedPoints: player.projectedPoints,
    injuryStatus: player.injuryStatus,
    recentAverage: player.recentAverage,
    recentGames: player.recentGames,
    addTrend48h: player.addTrendCount,
    dropTrend48h: player.dropTrendCount,
  };
}

export async function buildDashboardBundle(): Promise<DashboardBundle> {
  const config = getAppConfig();
  const [account, state, league] = await Promise.all([
    getSleeperUser(config.sleeperUsername),
    getNflState(),
    getLeague(config.sleeperLeagueId),
  ]);

  if (league.league_id !== config.sleeperLeagueId) {
    throw new DashboardDataError("The configured Sleeper league could not be verified.");
  }

  const week = Math.max(1, state.display_week || state.leg || state.week);
  const recentWeeks = Array.from(
    { length: Math.min(3, Math.max(0, week - 1)) },
    (_, index) => week - index - 1,
  );
  const [
    users,
    rosters,
    matchups,
    playerMap,
    projections,
    recentStats,
    trendingAdds,
    trendingDrops,
  ] = await Promise.all([
    getLeagueUsers(league.league_id),
    getLeagueRosters(league.league_id),
    getLeagueMatchups(league.league_id, week),
    getPlayers(),
    getWeeklyProjections(league.season, week, league.season_type || state.season_type),
    Promise.all(
      recentWeeks.map((recentWeek) =>
        getWeeklyStats(
          league.season,
          recentWeek,
          league.season_type || state.season_type,
        ),
      ),
    ),
    getTrendingPlayers("add"),
    getTrendingPlayers("drop"),
  ]);

  const myRoster = rosters.find((roster) => roster.owner_id === account.user_id);
  if (!myRoster) {
    throw new DashboardDataError(
      `Sleeper user ${config.sleeperUsername} does not own a roster in ${league.name}.`,
    );
  }

  const projectionMap = new Map(
    projections.map((projection) => [projection.player_id, projection]),
  );
  const receptionPoints = league.scoring_settings.rec ?? 0;
  const recentPointsByPlayer = new Map<string, number[]>();
  for (const weeklyStats of recentStats) {
    for (const statLine of weeklyStats) {
      const points = calculateProjectedPoints(
        statLine.stats,
        league.scoring_settings,
        {
          fallbackPoints: fallbackProjection(statLine, receptionPoints),
        },
      );
      if (points > 0) {
        const values = recentPointsByPlayer.get(statLine.player_id) ?? [];
        values.push(points);
        recentPointsByPlayer.set(statLine.player_id, values);
      }
    }
  }
  const addTrendCountByPlayer = new Map(
    trendingAdds.map((player) => [player.player_id, player.count]),
  );
  const dropTrendCountByPlayer = new Map(
    trendingDrops.map((player) => [player.player_id, player.count]),
  );
  const analysisById = new Map<string, AnalysisPlayer>();
  const viewById = new Map<string, PlayerView>();

  function analysisPlayer(playerId: string): AnalysisPlayer {
    const existing = analysisById.get(playerId);
    if (existing) return existing;
    const player = playerMap[playerId];
    const projection = projectionMap.get(playerId);
    const fallbackPoints = fallbackProjection(projection, receptionPoints);
    const projectedPoints = projection
      ? calculateProjectedPoints(projection.stats, league.scoring_settings, {
          fallbackPoints,
        })
      : 0;
    const normalized: AnalysisPlayer = {
      playerId,
      position: player?.position ?? null,
      fantasyPositions: player?.fantasy_positions,
      projectedPoints,
      injuryStatus:
        projection?.player?.injury_status ?? player?.injury_status ?? null,
    };
    const recentPoints = recentPointsByPlayer.get(playerId) ?? [];
    analysisById.set(playerId, normalized);
    viewById.set(playerId, {
      id: playerId,
      name: playerName(player, playerId),
      position: player?.position ?? "—",
      team: projection?.team ?? player?.team ?? "FA",
      opponent: projection?.opponent ?? null,
      projectedPoints,
      recentAverage: recentPoints.length
        ? recentPoints.reduce((total, points) => total + points, 0) /
          recentPoints.length
        : null,
      recentGames: recentPoints.length,
      addTrendCount: addTrendCountByPlayer.get(playerId) ?? 0,
      dropTrendCount: dropTrendCountByPlayer.get(playerId) ?? 0,
      injuryStatus: normalized.injuryStatus ?? null,
    });
    return normalized;
  }

  for (const roster of rosters) {
    for (const playerId of roster.players) analysisPlayer(playerId);
  }
  for (const projection of projections) {
    const player = playerMap[projection.player_id];
    if (
      player &&
      player.active !== false &&
      player.position &&
      ROSTERABLE_POSITIONS.has(player.position)
    ) {
      analysisPlayer(projection.player_id);
    }
  }

  const usersById = new Map(users.map((user) => [user.user_id, user]));
  const rostersById = new Map(rosters.map((roster) => [roster.roster_id, roster]));
  const myMatchup = matchups.find(
    (matchup) => matchup.roster_id === myRoster.roster_id,
  );
  const opponentMatchup = myMatchup?.matchup_id
    ? matchups.find(
        (matchup) =>
          matchup.matchup_id === myMatchup.matchup_id &&
          matchup.roster_id !== myRoster.roster_id,
      )
    : undefined;
  const opponentRoster = opponentMatchup
    ? rostersById.get(opponentMatchup.roster_id)
    : undefined;

  function rosterPlayers(roster: SleeperRoster) {
    return roster.players.map(analysisPlayer);
  }

  function buildTeam(
    roster: SleeperRoster,
    starterIds: readonly string[],
  ): TeamView {
    const owner = roster.owner_id ? usersById.get(roster.owner_id) : undefined;
    const starters = starterIds
      .map((playerId) => viewById.get(playerId))
      .filter((player): player is PlayerView => Boolean(player));
    return {
      rosterId: roster.roster_id,
      ownerName: owner?.display_name ?? owner?.username ?? "Unknown manager",
      teamName: teamName(owner, roster.roster_id),
      projectedPoints: starters.reduce(
        (total, player) => total + player.projectedPoints,
        0,
      ),
      starters,
    };
  }

  const myStarterIds = myMatchup?.starters.length
    ? myMatchup.starters
    : myRoster.starters;
  const myTeam = buildTeam(myRoster, myStarterIds);
  const opponent = opponentRoster
    ? buildTeam(
        opponentRoster,
        opponentMatchup?.starters.length
          ? opponentMatchup.starters
          : opponentRoster.starters,
      )
    : null;

  const myPlayers = rosterPlayers(myRoster);
  const lineupCandidates: LineupCandidateView[] = findStartSitSwaps(
    myPlayers,
    league.roster_positions,
    myStarterIds,
  )
    .filter((swap) => swap.sit)
    .slice(0, 8)
    .map((swap) => {
      const sit = viewById.get(swap.sit!.playerId)!;
      const start = viewById.get(swap.start.playerId)!;
      return {
        id: `lineup:${start.id}:${sit.id}:${swap.slotIndex}`,
        start,
        sit,
        projectedGain: swap.projectedGain,
      };
    });

  const rosteredIds = new Set(rosters.flatMap((roster) => roster.players));
  const availablePlayers = [...analysisById.values()].filter(
    (player) =>
      !rosteredIds.has(player.playerId) &&
      player.projectedPoints > 0 &&
      player.position &&
      ROSTERABLE_POSITIONS.has(player.position),
  );
  const waiverCandidates: WaiverCandidateView[] = shortlistWaiverCandidates(
    availablePlayers,
    myPlayers,
    league.roster_positions,
    { limit: 12, minimumGain: 0.5 },
  )
    .filter((candidate) => candidate.drop)
    .map((candidate) => {
      const add = viewById.get(candidate.add.playerId)!;
      const drop = viewById.get(candidate.drop!.playerId)!;
      return {
        id: `waiver:${add.id}:${drop.id}`,
        add,
        drop,
        projectedGain: candidate.projectedGain,
      };
    })
    .sort((a, b) => {
      const signal = (candidate: WaiverCandidateView) =>
        candidate.projectedGain +
        ((candidate.add.recentAverage ?? 0) -
          (candidate.drop.recentAverage ?? 0)) *
          0.15 +
        Math.log10(candidate.add.addTrendCount + 1) * 0.25 +
        Math.log10(candidate.drop.dropTrendCount + 1) * 0.15;
      return signal(b) - signal(a);
    });

  const tradeCandidates: TradeCandidateView[] = rosters
    .filter((roster) => roster.roster_id !== myRoster.roster_id)
    .flatMap((partnerRoster) => {
      const partner = partnerRoster.owner_id
        ? usersById.get(partnerRoster.owner_id)
        : undefined;
      return findBalancedTradeCandidates(
        myPlayers,
        rosterPlayers(partnerRoster),
        league.roster_positions,
        {
          limit: 4,
          minimumGain: 0.25,
          maximumProjectionDifference: 5,
        },
      ).map((candidate) => {
        const give = viewById.get(candidate.teamAGives.playerId)!;
        const receive = viewById.get(candidate.teamBGives.playerId)!;
        return {
          id: `trade:${partnerRoster.roster_id}:${give.id}:${receive.id}`,
          give,
          receive,
          partnerName: teamName(partner, partnerRoster.roster_id),
          myProjectedGain: candidate.teamAImprovement,
          partnerProjectedGain: candidate.teamBImprovement,
        };
      });
    })
    .sort(
      (a, b) =>
        b.myProjectedGain +
        b.partnerProjectedGain -
        (a.myProjectedGain + a.partnerProjectedGain),
    )
    .slice(0, 12);

  const projectionUpdatedAt =
    projections.reduce(
      (latest, projection) =>
        Math.max(
          latest,
          projection.updated_at ?? projection.last_modified ?? 0,
        ),
      0,
    ) || null;
  const recentStatsUpdatedAt =
    recentStats
      .flat()
      .reduce(
        (latest, statLine) =>
          Math.max(latest, statLine.updated_at ?? statLine.last_modified ?? 0),
        0,
      ) || null;
  const optimized = optimizeLineup(myPlayers, league.roster_positions);
  const fingerprint = stableFingerprint({
    version: 3,
    leagueId: league.league_id,
    season: league.season,
    week,
    starters: myStarterIds,
    rostered: rosters.map((roster) => [roster.roster_id, roster.players]),
    scoring: league.scoring_settings,
    projections: projectionUpdatedAt,
    recentStats: recentStatsUpdatedAt,
    addTrends: trendingAdds.map((player) => [player.player_id, player.count]),
    dropTrends: trendingDrops.map((player) => [player.player_id, player.count]),
    model: config.openRouterModel,
  });

  const view: DashboardViewData = {
    fingerprint,
    league: {
      id: league.league_id,
      name: league.name,
      season: league.season,
      week,
      scoringLabel: scoringLabel(league.scoring_settings),
    },
    myTeam,
    opponent,
    projectionUpdatedAt,
    model: config.openRouterModel,
    dataSources: [
      "Weekly projections",
      recentWeeks.length
        ? `Last ${recentWeeks.length} game logs`
        : "Season-opening player context",
      "48-hour add/drop trends",
      "Injury designations",
      "League scoring and roster rules",
    ],
    candidates: {
      lineup: lineupCandidates,
      waivers: waiverCandidates,
      trades: tradeCandidates,
    },
  };

  const prompt: RecommendationPromptInput = {
    context: {
      leagueName: league.name,
      season: league.season,
      week,
      scoringSummary: view.league.scoringLabel,
      myTeamName: myTeam.teamName,
      opponentName: opponent?.teamName ?? null,
      myProjectedPoints: optimized.totalProjectedPoints,
      opponentProjectedPoints: opponent?.projectedPoints ?? null,
      projectionUpdatedAt,
    },
    lineupCandidates: lineupCandidates.map((candidate) => ({
      id: candidate.id,
      start: promptPlayer(candidate.start),
      sit: promptPlayer(candidate.sit),
      projectedGain: candidate.projectedGain,
    })),
    waiverCandidates: waiverCandidates.map((candidate) => ({
      id: candidate.id,
      add: promptPlayer(candidate.add),
      drop: promptPlayer(candidate.drop),
      projectedGain: candidate.projectedGain,
    })),
    tradeCandidates: tradeCandidates.map((candidate) => ({
      id: candidate.id,
      partnerName: candidate.partnerName,
      give: promptPlayer(candidate.give),
      receive: promptPlayer(candidate.receive),
      myProjectedGain: candidate.myProjectedGain,
      partnerProjectedGain: candidate.partnerProjectedGain,
    })),
  };

  return { view, prompt };
}
