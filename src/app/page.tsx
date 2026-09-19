import {
  Activity,
  Calendar,
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

function TeamCard({
  team,
  label,
  paper = false,
}: {
  team: TeamView | null;
  label: string;
  paper?: boolean;
}) {
  return (
    <div
      className={
        paper
          ? "paper-noise min-h-full bg-[#f0eee2] p-5 text-[#112019] sm:p-6"
          : "min-h-full bg-[#0d1d17] p-5 text-white sm:p-6"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-score text-[0.65rem] font-bold tracking-[0.16em] opacity-45 uppercase">
            {label}
          </p>
          <h2 className="font-display mt-2 text-3xl leading-none font-extrabold tracking-tight">
            {team?.teamName ?? "Matchup pending"}
          </h2>
          <p className="mt-1 text-xs opacity-45">
            {team?.ownerName ?? "Sleeper has not assigned an opponent."}
          </p>
        </div>
        {team ? (
          <div className="text-right">
            <span className="font-display text-4xl font-black">
              {team.projectedPoints.toFixed(1)}
            </span>
            <p className="font-score text-[0.58rem] tracking-[0.12em] opacity-40 uppercase">
              projected
            </p>
          </div>
        ) : null}
      </div>
      {team?.starters.length ? (
        <ul className="mt-6">
          {team.starters.map((player) => (
            <PlayerRow key={player.id} player={player} />
          ))}
        </ul>
      ) : (
        <p className="mt-12 max-w-xs text-sm leading-6 opacity-50">
          Lineups will appear when Sleeper publishes this week&apos;s matchup.
        </p>
      )}
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
                <Calendar className="size-3.5" aria-hidden="true" />
                Matchup board
              </span>
              <span className="flex items-center gap-1 text-xs text-white/35">
                Read-only advice
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </span>
            </div>
            <div className="grid gap-px bg-white/9 lg:grid-cols-2">
              <TeamCard team={view.myTeam} label="Your side" />
              <TeamCard team={view.opponent} label="Opponent" paper />
            </div>
          </Panel>
        </section>

        <RecommendationWorkspace dashboard={view} />

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
