import {
  Activity,
  BarChartSquare02,
  ChevronRight,
  Clock,
  LogOut01,
  Target04,
} from "@untitledui/icons";

import { signOut } from "@/app/actions";
import { RecommendationWorkspace } from "@/components/recommendation-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { requireOwner } from "@/lib/auth";
import { buildDashboardBundle } from "@/lib/dashboard/data";
import type { PlayerView, TeamView } from "@/lib/dashboard/view-model";

export const dynamic = "force-dynamic";

function PlayerRow({ player }: { player: PlayerView }) {
  return (
    <li className="grid grid-cols-[2.2rem_1fr_auto] items-center gap-3 border-t border-current/8 py-3 first:border-0">
      <span className="font-score flex size-8 items-center justify-center rounded-lg bg-current/6 text-[0.65rem] font-bold">
        {player.position}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{player.name}</span>
        <span className="font-score mt-0.5 block text-[0.62rem] tracking-wide opacity-48 uppercase">
          {player.team}
          {player.opponent ? ` vs ${player.opponent}` : " · no opponent"}
          {player.injuryStatus ? ` · ${player.injuryStatus}` : ""}
        </span>
      </span>
      <span className="font-score text-sm font-bold">
        {player.projectedPoints.toFixed(1)}
      </span>
    </li>
  );
}

function LineupDetails({ team, label }: { team: TeamView | null; label: string }) {
  return (
    <details className="group rounded-2xl border border-white/9 bg-[#0d1d17]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <p className="font-score text-[0.62rem] font-bold tracking-[0.14em] text-lime-300 uppercase">
            {label}
          </p>
          <p className="mt-1 truncate text-base font-semibold">
            {team?.teamName ?? "Matchup pending"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {team ? (
            <span className="font-score text-lg font-bold">
              {team.projectedPoints.toFixed(1)}
            </span>
          ) : null}
          <ChevronRight
            className="size-4 text-white/35 transition-transform group-open:rotate-90"
            aria-hidden="true"
          />
        </div>
      </summary>
      <div className="border-t border-white/8 px-5 pb-3">
        {team?.starters.length ? (
          <ul>
            {team.starters.map((player) => (
              <PlayerRow key={player.id} player={player} />
            ))}
          </ul>
        ) : (
          <p className="py-6 text-sm leading-6 text-white/45">
            Sleeper has not published this lineup yet.
          </p>
        )}
      </div>
    </details>
  );
}

function MatchupComparison({
  myTeam,
  opponent,
}: {
  myTeam: TeamView;
  opponent: TeamView | null;
}) {
  const highest = Math.max(
    myTeam.projectedPoints,
    opponent?.projectedPoints ?? 0,
    1,
  );
  const margin = opponent
    ? myTeam.projectedPoints - opponent.projectedPoints
    : null;

  const rows = [
    { team: myTeam, label: "You", accent: true },
    { team: opponent, label: "Opponent", accent: false },
  ];

  return (
    <div className="px-5 py-6 sm:px-7 sm:py-7">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="font-score text-[0.65rem] font-bold tracking-[0.15em] text-lime-300 uppercase">
            Projected score
          </p>
          <h2 className="font-display mt-1 text-3xl font-extrabold">
            Matchup at a glance
          </h2>
        </div>
        {margin !== null ? (
          <Badge tone={margin >= 0 ? "positive" : "warning"}>
            {margin >= 0 ? "+" : ""}
            {margin.toFixed(1)} margin
          </Badge>
        ) : null}
      </div>

      <div className="space-y-5">
        {rows.map(({ team, label, accent }) => (
          <div key={label}>
            <div className="mb-2 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="font-score text-[0.6rem] tracking-[0.13em] text-white/35 uppercase">
                  {label}
                </p>
                <p className="truncate text-sm font-semibold sm:text-base">
                  {team?.teamName ?? "Not assigned"}
                </p>
              </div>
              <span
                className={
                  accent
                    ? "font-display text-4xl font-black text-lime-300"
                    : "font-display text-4xl font-black text-white/75"
                }
              >
                {team?.projectedPoints.toFixed(1) ?? "—"}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/7">
              <div
                className={
                  accent
                    ? "h-full rounded-full bg-lime-300"
                    : "h-full rounded-full bg-white/45"
                }
                style={{
                  width: team
                    ? `${Math.max(4, (team.projectedPoints / highest) * 100)}%`
                    : "0%",
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs leading-5 text-white/35">
        Baseline projection before applying any recommended lineup changes.
      </p>
    </div>
  );
}

export default async function Home() {
  await requireOwner();
  const { view } = await buildDashboardBundle();
  const projectionDate = view.projectionUpdatedAt
    ? new Date(view.projectionUpdatedAt).toLocaleString("en", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Unavailable";

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#07110e] text-white">
      <div className="field-grid pointer-events-none absolute inset-0 opacity-25" />
      <div className="pointer-events-none absolute top-[-18rem] right-[-12rem] size-[34rem] rounded-full bg-lime-300/8 blur-3xl" />

      <div className="relative mx-auto max-w-[90rem] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-lime-300 text-[#081510]">
              <Activity className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-lg leading-none font-extrabold tracking-tight">
                Fantasy Command Center
              </p>
              <p className="font-score mt-1 text-[0.58rem] tracking-[0.16em] text-white/34 uppercase">
                Private league intelligence
              </p>
            </div>
          </div>
          <form action={signOut}>
            <Button tone="ghost" type="submit" className="px-3 sm:px-4">
              <span className="hidden sm:inline">Sign out</span>
              <LogOut01 className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </header>

        <section className="rise-in mt-10">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="positive">
                  {view.league.season} · Week {view.league.week}
                </Badge>
                <Badge>{view.league.scoringLabel}</Badge>
              </div>
              <p className="font-score mt-5 text-xs font-bold tracking-[0.18em] text-lime-300 uppercase">
                Next matchup
              </p>
              <h1 className="font-display mt-2 max-w-4xl text-5xl leading-[0.9] font-black tracking-[-0.045em] sm:text-7xl lg:text-[5.7rem]">
                {view.league.name}
              </h1>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/9 bg-white/9 lg:min-w-[27rem]">
              <div className="bg-[#0b1914] p-4">
                <div className="flex items-center gap-2 text-white/35">
                  <Clock className="size-4" aria-hidden="true" />
                  <span className="font-score text-[0.62rem] tracking-[0.1em] uppercase">
                    Projections
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold">{projectionDate}</p>
              </div>
              <div className="bg-[#0b1914] p-4">
                <div className="flex items-center gap-2 text-white/35">
                  <Target04 className="size-4" aria-hidden="true" />
                  <span className="font-score text-[0.62rem] tracking-[0.1em] uppercase">
                    Candidates
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold">
                  {view.candidates.lineup.length +
                    view.candidates.waivers.length +
                    view.candidates.trades.length}{" "}
                  moves
                </p>
              </div>
            </div>
          </div>

          <Panel className="yard-lines mt-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-3">
              <span className="flex items-center gap-2 font-score text-[0.65rem] tracking-[0.14em] text-white/38 uppercase">
                <BarChartSquare02 className="size-3.5" aria-hidden="true" />
                Matchup board
              </span>
              <span className="flex items-center gap-1 text-xs text-white/35">
                Read-only advice
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </span>
            </div>
            <MatchupComparison myTeam={view.myTeam} opponent={view.opponent} />
          </Panel>
        </section>

        <RecommendationWorkspace dashboard={view} />

        <section className="mt-6" aria-labelledby="lineup-details-title">
          <div className="mb-3 flex items-center justify-between">
            <h2
              id="lineup-details-title"
              className="font-score text-xs font-bold tracking-[0.14em] text-white/45 uppercase"
            >
              Current lineup details
            </h2>
            <span className="text-xs text-white/25">Tap to expand</span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <LineupDetails team={view.myTeam} label="Your starters" />
            <LineupDetails team={view.opponent} label="Opponent starters" />
          </div>
        </section>

        <footer className="flex flex-col gap-2 py-8 text-xs leading-5 text-white/28 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Sleeper data is read-only. Review injuries and execute every move in
            Sleeper.
          </p>
          <p>Undocumented projection feed · AI can be wrong</p>
        </footer>
      </div>
    </main>
  );
}
