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
    <li className="grid grid-cols-[2.4rem_1fr_auto] items-center gap-3 border-t border-[#e5e1d8] py-3.5 first:border-0">
      <span className="flex size-9 items-center justify-center rounded-full bg-[#edf0f4] text-[0.68rem] font-extrabold text-[#46515d]">
        {player.position}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-[#17202a]">
          {player.name}
        </span>
        <span className="mt-0.5 block truncate text-xs text-[#747d87]">
          {player.team}
          {player.opponent ? ` vs ${player.opponent}` : " · No opponent"}
          {player.injuryStatus ? ` · ${player.injuryStatus}` : ""}
        </span>
      </span>
      <span className="text-sm font-extrabold text-[#29333e]">
        {player.projectedPoints.toFixed(1)}
      </span>
    </li>
  );
}

function LineupDetails({ team, label }: { team: TeamView | null; label: string }) {
  return (
    <details className="group overflow-hidden rounded-[1.2rem] border border-[#d9d5cb] bg-[#fffdf8]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4.5">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#2855d9]">{label}</p>
          <p className="mt-1 truncate text-base font-bold text-[#17202a]">
            {team?.teamName ?? "Matchup pending"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {team ? (
            <span className="text-xl font-extrabold text-[#17202a]">
              {team.projectedPoints.toFixed(1)}
            </span>
          ) : null}
          <ChevronRight
            className="size-4 text-[#7b838c] transition-transform group-open:rotate-90"
            aria-hidden="true"
          />
        </div>
      </summary>
      <div className="border-t border-[#e5e1d8] px-5 pb-3">
        {team?.starters.length ? (
          <ul>
            {team.starters.map((player) => (
              <PlayerRow key={player.id} player={player} />
            ))}
          </ul>
        ) : (
          <p className="py-6 text-sm leading-6 text-[#6c7680]">
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
    { team: myTeam, label: "Your lineup", accent: true },
    { team: opponent, label: "Opponent", accent: false },
  ];

  return (
    <Panel className="yard-lines overflow-hidden">
      <div className="border-b border-[#e3dfd5] px-5 py-4 sm:px-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#6f7780]">Matchup outlook</p>
            <h2 className="font-display mt-1 text-3xl font-semibold tracking-[-0.025em]">
              Projected score
            </h2>
          </div>
          {margin !== null ? (
            <Badge tone={margin >= 0 ? "positive" : "warning"}>
              {margin >= 0 ? "+" : ""}
              {margin.toFixed(1)} point edge
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="space-y-6 px-5 py-6 sm:px-7 sm:py-7">
        {rows.map(({ team, label, accent }) => (
          <div key={label}>
            <div className="mb-2 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#78818b]">{label}</p>
                <p className="mt-0.5 truncate text-sm font-bold text-[#303a45]">
                  {team?.teamName ?? "Not assigned"}
                </p>
              </div>
              <span
                className={
                  accent
                    ? "text-3xl font-extrabold text-[#2855d9]"
                    : "text-3xl font-extrabold text-[#55616e]"
                }
              >
                {team?.projectedPoints.toFixed(1) ?? "—"}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#e7e3da]">
              <div
                className={
                  accent
                    ? "h-full rounded-full bg-[#2855d9]"
                    : "h-full rounded-full bg-[#8b96a2]"
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
        <p className="border-t border-[#e3dfd5] pt-4 text-xs leading-5 text-[#717b85]">
          Baseline projection from the current Sleeper lineups. Recommended
          changes are shown separately so the comparison remains auditable.
        </p>
      </div>
    </Panel>
  );
}

function ReadinessCard({
  lineupMoves,
  injuryCount,
  projectionDate,
}: {
  lineupMoves: number;
  injuryCount: number;
  projectionDate: string;
}) {
  const checks = [
    {
      label: "Lineup review",
      value: lineupMoves ? `${lineupMoves} change${lineupMoves === 1 ? "" : "s"} found` : "Best projected lineup",
      tone: lineupMoves ? "attention" : "ready",
    },
    {
      label: "Injury watch",
      value: injuryCount ? `${injuryCount} designation${injuryCount === 1 ? "" : "s"}` : "No designations",
      tone: injuryCount ? "attention" : "ready",
    },
    {
      label: "Projection feed",
      value: projectionDate,
      tone: "neutral",
    },
  ] as const;

  return (
    <Panel className="p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <Target04 className="size-4 text-[#2855d9]" aria-hidden="true" />
        <h2 className="text-sm font-extrabold">Lineup readiness</h2>
      </div>
      <div className="space-y-4">
        {checks.map((check) => (
          <div key={check.label} className="flex items-start gap-3">
            <span
              className={
                check.tone === "ready"
                  ? "mt-1.5 size-2 shrink-0 rounded-full bg-[#2c8967]"
                  : check.tone === "attention"
                    ? "mt-1.5 size-2 shrink-0 rounded-full bg-[#d06a31]"
                    : "mt-1.5 size-2 shrink-0 rounded-full bg-[#85909c]"
              }
            />
            <div>
              <p className="text-xs font-semibold text-[#7a838c]">{check.label}</p>
              <p className="mt-0.5 text-sm font-bold text-[#26313c]">{check.value}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
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
  const margin = view.opponent
    ? view.myTeam.projectedPoints - view.opponent.projectedPoints
    : null;
  const moveCount =
    view.candidates.lineup.length +
    view.candidates.waivers.length +
    view.candidates.trades.length;
  const injuryCount = view.myTeam.starters.filter(
    (player) => player.injuryStatus,
  ).length;
  const outlook =
    margin === null
      ? "Prepare for the week ahead."
      : margin >= 5
        ? "Protect your advantage."
        : margin <= -5
          ? "Find an edge before kickoff."
          : "A close week will reward small decisions.";
  const briefing =
    moveCount > 0
      ? `${moveCount} grounded opportunities are ready to review across your lineup, waivers, and trade market.`
      : "Your current roster construction looks sound. Monitor late injury news before kickoff.";

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#f2efe7] text-[#17202a]">
      <div className="field-grid pointer-events-none absolute inset-x-0 top-0 h-[48rem] opacity-70" />
      <div className="pointer-events-none absolute top-[-15rem] right-[-9rem] size-[30rem] rounded-full bg-[#dce4ff] blur-3xl" />

      <div className="relative mx-auto max-w-[88rem] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <header className="flex items-center justify-between gap-5 border-b border-[#cfcbc1] pb-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#17202a] text-white">
              <Activity className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-xl leading-none font-semibold tracking-[-0.02em]">
                Fantasy Command Center
              </p>
              <p className="mt-1 text-[0.68rem] font-bold tracking-[0.08em] text-[#747d87]">
                WEEKLY LEAGUE INTELLIGENCE
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-bold text-[#68727d] md:flex">
            <a className="text-[#17202a]" href="#this-week">This week</a>
            <a className="transition hover:text-[#17202a]" href="#decisions">Decisions</a>
            <a className="transition hover:text-[#17202a]" href="#lineups">Lineups</a>
          </nav>

          <form action={signOut}>
            <Button tone="ghost" type="submit" className="px-3 sm:px-4">
              <span className="hidden sm:inline">Sign out</span>
              <LogOut01 className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </header>

        <section id="this-week" className="rise-in scroll-mt-6 pt-9 sm:pt-12">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(19rem,0.75fr)]">
            <article className="relative overflow-hidden rounded-[1.6rem] bg-[#17202a] px-6 py-7 text-white shadow-[0_20px_50px_rgba(23,32,42,0.14)] sm:px-9 sm:py-9">
              <div className="paper-noise pointer-events-none absolute inset-0 opacity-15" />
              <div className="pointer-events-none absolute right-[-5rem] bottom-[-7rem] size-72 rounded-full bg-[#2855d9]/45 blur-3xl" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-white/15 bg-white/10 text-white">
                    {view.league.season} · Week {view.league.week}
                  </Badge>
                  <Badge className="border-white/15 bg-white/10 text-white/75">
                    {view.league.scoringLabel}
                  </Badge>
                </div>
                <p className="mt-8 text-xs font-bold tracking-[0.08em] text-[#aebfff]">
                  YOUR WEEKLY BRIEFING
                </p>
                <h1 className="font-display mt-3 max-w-4xl text-5xl leading-[0.95] font-semibold tracking-[-0.045em] sm:text-7xl">
                  {outlook}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-white/67 sm:text-lg">
                  {briefing}
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href="#decisions"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-extrabold text-[#17202a] transition hover:-translate-y-0.5 hover:bg-[#eef1ff]"
                  >
                    Review the game plan
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </a>
                  <span className="text-xs text-white/45">
                    {view.league.name}
                  </span>
                </div>
              </div>
            </article>

            <div className="grid gap-5">
              <ReadinessCard
                lineupMoves={view.candidates.lineup.length}
                injuryCount={injuryCount}
                projectionDate={projectionDate}
              />
              <Panel className="flex items-center justify-between gap-5 p-5 sm:p-6">
                <div>
                  <p className="text-xs font-semibold text-[#737d87]">Opportunity scan</p>
                  <p className="mt-1 text-3xl font-extrabold">{moveCount}</p>
                  <p className="mt-1 text-sm text-[#68727d]">legal moves assessed</p>
                </div>
                <span className="flex size-12 items-center justify-center rounded-full bg-[#e8edff] text-[#2855d9]">
                  <BarChartSquare02 className="size-5" aria-hidden="true" />
                </span>
              </Panel>
            </div>
          </div>
        </section>

        <section className="rise-in-delayed mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(19rem,0.8fr)]">
          <MatchupComparison myTeam={view.myTeam} opponent={view.opponent} />
          <Panel className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-[#2855d9]" aria-hidden="true" />
              <h2 className="text-sm font-extrabold">What to know</h2>
            </div>
            <p className="font-display mt-5 text-3xl leading-[1.05] font-semibold tracking-[-0.025em]">
              {margin === null
                ? "The matchup is still taking shape."
                : Math.abs(margin) < 5
                  ? "Every marginal point matters this week."
                  : margin > 0
                    ? "Favor reliable volume over unnecessary volatility."
                    : "Upside and contingency planning matter more than floor."}
            </p>
            <p className="mt-4 text-sm leading-6 text-[#65707a]">
              Recommendations combine your league rules, current lineups,
              projections, recent scoring, injuries, and 48-hour player trends.
            </p>
            <div className="mt-6 border-t border-[#e1ddd3] pt-4 text-xs leading-5 text-[#77818b]">
              Projection data updated {projectionDate}. Always verify late
              inactive reports in Sleeper.
            </div>
          </Panel>
        </section>

        <RecommendationWorkspace dashboard={view} />

        <section
          id="lineups"
          className="mt-8 scroll-mt-6 border-t border-[#cfcbc1] pt-7"
          aria-labelledby="lineup-details-title"
        >
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#2855d9]">Source lineups</p>
              <h2
                id="lineup-details-title"
                className="font-display mt-1 text-3xl font-semibold tracking-[-0.02em]"
              >
                Inspect the matchup
              </h2>
            </div>
            <span className="hidden text-xs text-[#727c86] sm:inline">
              Select a team to expand
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <LineupDetails team={view.myTeam} label="Your starters" />
            <LineupDetails team={view.opponent} label="Opponent starters" />
          </div>
        </section>

        <footer className="mt-10 flex flex-col gap-2 border-t border-[#cfcbc1] py-7 text-xs leading-5 text-[#76808a] sm:flex-row sm:items-center sm:justify-between">
          <p>
            Read-only analysis. Review injuries and execute every move in Sleeper.
          </p>
          <p>Grounded recommendations · No invented player news</p>
        </footer>
      </div>
    </main>
  );
}
