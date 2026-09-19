import type {
  AnalysisPlayer,
  CandidateOptions,
  LineupEntry,
  OptimizedLineup,
  RosterSlot,
  ScoringOptions,
  ScoringSettings,
  StartSitSwap,
  TradeCandidate,
  TradeOptions,
  WaiverCandidate,
} from "./types";

const EXCLUDED_SLOTS = new Set(["BN", "IR", "TAXI"]);
const OFFENSE = new Set(["QB", "RB", "WR", "TE"]);
const IDP = new Set(["DL", "DE", "DT", "LB", "DB", "CB", "S"]);
const DEFAULT_INACTIVE = ["IR", "OUT", "PUP", "SUSPENDED", "INACTIVE"];
const DEFAULT_FALLBACK_KEYS = [
  "pts_ppr",
  "pts_half_ppr",
  "pts_std",
  "fantasy_points",
  "points",
  "pts",
];

function normalized(value: string): string {
  return value.trim().toUpperCase();
}

function playerPositions(
  player: Pick<AnalysisPlayer, "position" | "fantasyPositions">,
): Set<string> {
  return new Set(
    [...(player.fantasyPositions ?? []), player.position ?? ""]
      .map(normalized)
      .filter(Boolean)
      .map((position) => (position === "DST" ? "DEF" : position)),
  );
}

/** Returns whether a player may occupy a Sleeper roster slot. */
export function isEligibleForSlot(
  player: Pick<AnalysisPlayer, "position" | "fantasyPositions">,
  rosterSlot: RosterSlot,
): boolean {
  const slot = normalized(rosterSlot);
  if (EXCLUDED_SLOTS.has(slot)) return false;

  const positions = playerPositions(player);
  if (slot === "FLEX") {
    return ["RB", "WR", "TE"].some((position) => positions.has(position));
  }
  if (slot === "WRRB_FLEX") {
    return positions.has("WR") || positions.has("RB");
  }
  if (slot === "REC_FLEX") {
    return positions.has("WR") || positions.has("TE");
  }
  if (slot === "SUPER_FLEX") {
    return [...OFFENSE].some((position) => positions.has(position));
  }
  if (slot === "IDP_FLEX") {
    return [...IDP].some((position) => positions.has(position));
  }
  return positions.has(slot === "DST" ? "DEF" : slot);
}

/**
 * Applies every matching Sleeper scoring multiplier. A supplied fallback (or a
 * common projected-points field) is used only when no scoring input matched.
 */
export function calculateProjectedPoints(
  stats: Readonly<Record<string, number>>,
  scoringSettings: Readonly<ScoringSettings>,
  options: ScoringOptions = {},
): number {
  let points = 0;
  let matches = 0;
  for (const key of Object.keys(stats).sort()) {
    const multiplier = scoringSettings[key];
    if (typeof multiplier === "number" && Number.isFinite(multiplier)) {
      const value = stats[key];
      if (Number.isFinite(value)) {
        points += value * multiplier;
        matches += 1;
      }
    }
  }
  if (matches > 0) return points;
  if (options.fallbackPoints !== undefined) return options.fallbackPoints;
  for (const key of options.fallbackStatKeys ?? DEFAULT_FALLBACK_KEYS) {
    const value = stats[key];
    if (Number.isFinite(value)) return value;
  }
  return 0;
}

interface FlowEdge {
  to: number;
  reverse: number;
  capacity: number;
  cost: number;
  playerIndex?: number;
}

function addEdge(graph: FlowEdge[][], from: number, edge: FlowEdge): void {
  const reverse = graph[edge.to].length;
  const fromReverse = graph[from].length;
  graph[from].push({ ...edge, reverse });
  graph[edge.to].push({
    to: from,
    reverse: fromReverse,
    capacity: 0,
    cost: -edge.cost,
  });
}

/** Finds the maximum-projection legal assignment for the ordered active slots. */
export function optimizeLineup(
  rosterPlayers: readonly AnalysisPlayer[],
  rosterPositions: readonly RosterSlot[],
): OptimizedLineup {
  const slots = rosterPositions
    .map((slot, originalIndex) => ({ slot: normalized(slot), originalIndex }))
    .filter(({ slot }) => !EXCLUDED_SLOTS.has(slot));
  const players = [...rosterPlayers].sort((a, b) =>
    a.playerId.localeCompare(b.playerId),
  );
  const source = 0;
  const slotOffset = 1;
  const playerOffset = slotOffset + slots.length;
  const sink = playerOffset + players.length;
  const graph: FlowEdge[][] = Array.from({ length: sink + 1 }, () => []);

  slots.forEach(({ slot }, slotIndex) => {
    const slotNode = slotOffset + slotIndex;
    addEdge(graph, source, { to: slotNode, reverse: 0, capacity: 1, cost: 0 });
    // Empty assignments make incomplete rosters legal without reusing players.
    addEdge(graph, slotNode, {
      to: sink,
      reverse: 0,
      capacity: 1,
      cost: 0,
    });
    players.forEach((player, playerIndex) => {
      if (isEligibleForSlot(player, slot)) {
        addEdge(graph, slotNode, {
          to: playerOffset + playerIndex,
          reverse: 0,
          capacity: 1,
          cost: -player.projectedPoints,
          playerIndex,
        });
      }
    });
  });
  players.forEach((_, playerIndex) => {
    addEdge(graph, playerOffset + playerIndex, {
      to: sink,
      reverse: 0,
      capacity: 1,
      cost: 0,
    });
  });

  for (let flow = 0; flow < slots.length; flow += 1) {
    const distance = Array(graph.length).fill(Number.POSITIVE_INFINITY);
    const previousNode = Array(graph.length).fill(-1);
    const previousEdge = Array(graph.length).fill(-1);
    distance[source] = 0;
    // Bellman-Ford is small here and supports negative projection costs.
    for (let iteration = 0; iteration < graph.length - 1; iteration += 1) {
      let changed = false;
      for (let node = 0; node < graph.length; node += 1) {
        if (!Number.isFinite(distance[node])) continue;
        graph[node].forEach((edge, edgeIndex) => {
          const candidate = distance[node] + edge.cost;
          if (edge.capacity > 0 && candidate < distance[edge.to] - 1e-10) {
            distance[edge.to] = candidate;
            previousNode[edge.to] = node;
            previousEdge[edge.to] = edgeIndex;
            changed = true;
          }
        });
      }
      if (!changed) break;
    }
    if (previousNode[sink] < 0) break;
    for (let node = sink; node !== source; node = previousNode[node]) {
      const edge = graph[previousNode[node]][previousEdge[node]];
      edge.capacity -= 1;
      graph[node][edge.reverse].capacity += 1;
    }
  }

  const entries: LineupEntry[] = slots.map(({ slot, originalIndex }, slotIndex) => {
    const edge = graph[slotOffset + slotIndex].find(
      (candidate) =>
        candidate.playerIndex !== undefined && candidate.capacity === 0,
    );
    return {
      slot,
      slotIndex: originalIndex,
      player: edge?.playerIndex === undefined ? null : players[edge.playerIndex],
    };
  });
  const starterIds = new Set(
    entries.flatMap(({ player }) => (player ? [player.playerId] : [])),
  );
  const starters = entries.flatMap(({ player }) => (player ? [player] : []));
  return {
    entries,
    starters,
    bench: players.filter((player) => !starterIds.has(player.playerId)),
    totalProjectedPoints: starters.reduce(
      (total, player) => total + player.projectedPoints,
      0,
    ),
  };
}

function hasLegalStarterAssignment(
  players: readonly AnalysisPlayer[],
  rosterPositions: readonly RosterSlot[],
): boolean {
  const activeSlots = rosterPositions
    .map(normalized)
    .filter((slot) => !EXCLUDED_SLOTS.has(slot));
  if (players.length > activeSlots.length) return false;

  const playerForSlot = Array<number>(activeSlots.length).fill(-1);
  const assign = (playerIndex: number, visited: boolean[]): boolean => {
    for (let slotIndex = 0; slotIndex < activeSlots.length; slotIndex += 1) {
      if (
        visited[slotIndex] ||
        !isEligibleForSlot(players[playerIndex], activeSlots[slotIndex])
      ) continue;
      visited[slotIndex] = true;
      if (
        playerForSlot[slotIndex] < 0 ||
        assign(playerForSlot[slotIndex], visited)
      ) {
        playerForSlot[slotIndex] = playerIndex;
        return true;
      }
    }
    return false;
  };

  return players.every((_, playerIndex) =>
    assign(playerIndex, Array(activeSlots.length).fill(false)),
  );
}

/** Compares the current and optimal starter sets without reporting relocations. */
export function findStartSitSwaps(
  rosterPlayers: readonly AnalysisPlayer[],
  rosterPositions: readonly RosterSlot[],
  currentStarterIds: readonly (string | null)[],
): StartSitSwap[] {
  const optimized = optimizeLineup(rosterPlayers, rosterPositions);
  const byId = new Map(rosterPlayers.map((player) => [player.playerId, player]));
  const currentIds = new Set(currentStarterIds.filter((id): id is string => !!id));
  const optimizedIds = new Set(
    optimized.starters.map(({ playerId }) => playerId),
  );
  const currentPlayers = [...currentIds].flatMap((id) => {
    const current = byId.get(id);
    return current ? [current] : [];
  });
  const starts = optimized.entries.flatMap((entry) =>
    entry.player && !currentIds.has(entry.player.playerId)
      ? [{ entry, player: entry.player }]
      : [],
  );
  const sits = currentPlayers
    .filter(({ playerId }) => !optimizedIds.has(playerId))
    .sort(
      (a, b) =>
        a.projectedPoints - b.projectedPoints ||
        a.playerId.localeCompare(b.playerId),
    );

  const matchedStartForSit = Array<number>(sits.length).fill(-1);
  const pair = (startIndex: number, visited: boolean[]): boolean => {
    const start = starts[startIndex].player;
    for (let sitIndex = 0; sitIndex < sits.length; sitIndex += 1) {
      if (visited[sitIndex]) continue;
      const sit = sits[sitIndex];
      const proposedStarters = currentPlayers
        .filter(({ playerId }) => playerId !== sit.playerId)
        .concat(start);
      if (!hasLegalStarterAssignment(proposedStarters, rosterPositions)) continue;
      visited[sitIndex] = true;
      if (
        matchedStartForSit[sitIndex] < 0 ||
        pair(matchedStartForSit[sitIndex], visited)
      ) {
        matchedStartForSit[sitIndex] = startIndex;
        return true;
      }
    }
    return false;
  };

  starts.forEach((_, startIndex) => {
    pair(startIndex, Array(sits.length).fill(false));
  });

  const sitForStart = new Map<number, AnalysisPlayer>();
  matchedStartForSit.forEach((startIndex, sitIndex) => {
    if (startIndex >= 0) sitForStart.set(startIndex, sits[sitIndex]);
  });
  return starts.flatMap<StartSitSwap>(({ entry, player: start }, startIndex) => {
    const sit = sitForStart.get(startIndex);
    if (sit) {
      return [{
        slot: entry.slot,
        slotIndex: entry.slotIndex,
        start,
        sit,
        projectedGain: start.projectedPoints - sit.projectedPoints,
      }];
    }

    const proposedStarters = currentPlayers.concat(start);
    if (!hasLegalStarterAssignment(proposedStarters, rosterPositions)) return [];
    return [{
      slot: entry.slot,
      slotIndex: entry.slotIndex,
      start,
      sit: null,
      projectedGain: start.projectedPoints,
    }];
  });
}

function isUnavailable(
  player: AnalysisPlayer,
  statuses: readonly string[],
): boolean {
  return statuses.map(normalized).includes(normalized(player.injuryStatus ?? ""));
}

/** Ranks legal waiver add/drop moves by resulting optimal-lineup improvement. */
export function shortlistWaiverCandidates(
  availablePlayers: readonly AnalysisPlayer[],
  rosterPlayers: readonly AnalysisPlayer[],
  rosterPositions: readonly RosterSlot[],
  options: CandidateOptions = {},
): WaiverCandidate[] {
  const limit = Math.max(0, options.limit ?? 10);
  const minimumGain = options.minimumGain ?? 0;
  const statuses = options.unavailableInjuryStatuses ?? DEFAULT_INACTIVE;
  const protectedDropPlayerIds = new Set(options.protectedDropPlayerIds ?? []);
  const rosterIds = new Set(rosterPlayers.map(({ playerId }) => playerId));
  const before = optimizeLineup(rosterPlayers, rosterPositions).totalProjectedPoints;
  const candidates: WaiverCandidate[] = [];

  for (const add of [...availablePlayers].sort((a, b) =>
    a.playerId.localeCompare(b.playerId),
  )) {
    if (
      rosterIds.has(add.playerId) ||
      isUnavailable(add, statuses) ||
      !rosterPositions.some((slot) => isEligibleForSlot(add, slot))
    ) continue;

    const drops: (AnalysisPlayer | null)[] = rosterPlayers.length > 0
      ? [...rosterPlayers].sort((a, b) =>
          a.projectedPoints - b.projectedPoints ||
          a.playerId.localeCompare(b.playerId),
        ).filter(({ playerId }) => !protectedDropPlayerIds.has(playerId))
      : [null];
    for (const drop of drops) {
      const afterRoster = rosterPlayers
        .filter(({ playerId }) => playerId !== drop?.playerId)
        .concat(add);
      const after = optimizeLineup(afterRoster, rosterPositions).totalProjectedPoints;
      const lineupGain = after - before;
      const projectedGain = add.projectedPoints - (drop?.projectedPoints ?? 0);
      if (lineupGain > minimumGain) {
        candidates.push({ add, drop, projectedGain, lineupGain });
      }
    }
  }
  return candidates
    .sort(
      (a, b) =>
        b.lineupGain - a.lineupGain ||
        b.projectedGain - a.projectedGain ||
        a.add.playerId.localeCompare(b.add.playerId) ||
        (a.drop?.playerId ?? "").localeCompare(b.drop?.playerId ?? ""),
    )
    .slice(0, limit);
}

/** Ranks one-for-one swaps that increase both teams' optimal starting totals. */
export function findBalancedTradeCandidates(
  teamA: readonly AnalysisPlayer[],
  teamB: readonly AnalysisPlayer[],
  rosterPositions: readonly RosterSlot[],
  options: TradeOptions = {},
): TradeCandidate[] {
  const limit = Math.max(0, options.limit ?? 10);
  const minimumGain = options.minimumGain ?? 0;
  const maximumDifference =
    options.maximumProjectionDifference ?? Number.POSITIVE_INFINITY;
  const statuses = options.unavailableInjuryStatuses ?? DEFAULT_INACTIVE;
  const beforeA = optimizeLineup(teamA, rosterPositions).totalProjectedPoints;
  const beforeB = optimizeLineup(teamB, rosterPositions).totalProjectedPoints;
  const candidates: TradeCandidate[] = [];

  for (const givesA of teamA) {
    if (isUnavailable(givesA, statuses)) continue;
    for (const givesB of teamB) {
      if (
        isUnavailable(givesB, statuses) ||
        Math.abs(givesA.projectedPoints - givesB.projectedPoints) >
          maximumDifference
      ) continue;
      const nextA = teamA.filter((p) => p.playerId !== givesA.playerId).concat(givesB);
      const nextB = teamB.filter((p) => p.playerId !== givesB.playerId).concat(givesA);
      const teamAImprovement =
        optimizeLineup(nextA, rosterPositions).totalProjectedPoints - beforeA;
      const teamBImprovement =
        optimizeLineup(nextB, rosterPositions).totalProjectedPoints - beforeB;
      if (teamAImprovement > minimumGain && teamBImprovement > minimumGain) {
        candidates.push({
          teamAGives: givesA,
          teamBGives: givesB,
          teamAImprovement,
          teamBImprovement,
          balanceDifference: Math.abs(teamAImprovement - teamBImprovement),
        });
      }
    }
  }
  return candidates
    .sort(
      (a, b) =>
        a.balanceDifference - b.balanceDifference ||
        b.teamAImprovement + b.teamBImprovement -
          (a.teamAImprovement + a.teamBImprovement) ||
        a.teamAGives.playerId.localeCompare(b.teamAGives.playerId) ||
        a.teamBGives.playerId.localeCompare(b.teamBGives.playerId),
    )
    .slice(0, limit);
}

/** Stable, key-order-independent FNV-1a fingerprint for JSON-compatible inputs. */
export function stableFingerprint(value: unknown): string {
  const seen = new WeakSet<object>();
  const serialize = (input: unknown): string => {
    if (input === null || typeof input !== "object") {
      if (typeof input === "number" && !Number.isFinite(input)) {
        return JSON.stringify(String(input));
      }
      return JSON.stringify(input) ?? String(input);
    }
    if (seen.has(input)) throw new TypeError("Cannot fingerprint cyclic values");
    seen.add(input);
    const result = Array.isArray(input)
      ? `[${input.map(serialize).join(",")}]`
      : `{${Object.keys(input as object)
          .sort()
          .map((key) =>
            `${JSON.stringify(key)}:${serialize((input as Record<string, unknown>)[key])}`,
          )
          .join(",")}}`;
    seen.delete(input);
    return result;
  };
  let hash = 0x811c9dc5;
  for (const character of serialize(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
