import { Activity, BarChartSquare02, Stars02 } from "@untitledui/icons";

const stages = [
  "Syncing your Sleeper league",
  "Comparing lineup, waiver, and trade options",
  "Writing your analyst briefing",
];

export default function Loading() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#f2efe7] px-4 py-5 text-[#17202a] sm:px-6 lg:px-8 lg:py-7">
      <div className="field-grid pointer-events-none absolute inset-x-0 top-0 h-[48rem] opacity-70" />
      <div className="pointer-events-none absolute top-[-15rem] right-[-9rem] size-[30rem] rounded-full bg-[#dce4ff] blur-3xl" />

      <div className="relative mx-auto max-w-[88rem]">
        <header className="flex items-center justify-between border-b border-[#cfcbc1] pb-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#17202a] text-white">
              <Activity className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-xl leading-none font-semibold tracking-[-0.02em]">
                The Fantasy Desk
              </p>
              <p className="mt-1 text-[0.68rem] font-bold tracking-[0.08em] text-[#747d87]">
                YOUR PRIVATE LEAGUE ANALYST
              </p>
            </div>
          </div>
          <div className="h-10 w-24 rounded-full bg-[#dfdbd2]" />
        </header>

        <section
          className="mt-9 grid gap-5 sm:mt-12 lg:grid-cols-[minmax(0,1.65fr)_minmax(19rem,0.75fr)]"
          role="status"
          aria-live="polite"
          aria-label="Generating your latest fantasy dashboard"
        >
          <div className="relative flex min-h-[27rem] items-center overflow-hidden rounded-[1.6rem] bg-[#17202a] px-6 py-10 text-white shadow-[0_20px_50px_rgba(23,32,42,0.14)] sm:px-10">
            <div className="paper-noise pointer-events-none absolute inset-0 opacity-15" />
            <div className="pointer-events-none absolute right-[-5rem] bottom-[-7rem] size-72 rounded-full bg-[#2855d9]/45 blur-3xl" />
            <div className="relative max-w-2xl">
              <div className="loading-orbit relative flex size-16 items-center justify-center rounded-full border border-white/15 bg-white/8">
                <span className="absolute inset-[-0.35rem] rounded-full border border-[#829cff]/45" />
                <Stars02 className="size-6 text-[#aebfff]" aria-hidden="true" />
              </div>
              <p className="mt-8 text-xs font-extrabold tracking-[0.08em] text-[#aebfff]">
                FRESH ANALYSIS IN PROGRESS
              </p>
              <h1 className="font-display mt-3 text-5xl leading-[0.95] font-semibold tracking-[-0.04em] sm:text-7xl">
                Building your weekly briefing.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-6 text-white/58 sm:text-base">
                We&apos;re reviewing the latest matchup, roster, injury, and
                player-trend data before ranking your best moves.
              </p>
              <div className="mt-8 h-1.5 max-w-xl overflow-hidden rounded-full bg-white/10">
                <div className="loading-progress h-full w-2/5 rounded-full bg-[#829cff]" />
              </div>
            </div>
          </div>

          <div className="rounded-[1.35rem] border border-[#d9d5cb] bg-[#fffdf8] p-6 shadow-[0_14px_36px_rgba(37,43,52,0.07)]">
            <div className="flex items-center gap-2">
              <BarChartSquare02
                className="size-4 text-[#2855d9]"
                aria-hidden="true"
              />
              <p className="text-sm font-extrabold">Preparing your dashboard</p>
            </div>
            <div className="mt-7 space-y-6">
              {stages.map((stage, index) => (
                <div
                  key={stage}
                  className="loading-stage flex items-start gap-3"
                  style={{ animationDelay: `${index * 900}ms` }}
                >
                  <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border border-[#b8c6f3] bg-[#eef1ff]">
                    <span className="size-1.5 rounded-full bg-[#2855d9]" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#303a45]">{stage}</p>
                    <p className="mt-1 text-xs leading-5 text-[#7a838c]">
                      {index === 0
                        ? "Refreshing league rules, lineups, and projections"
                        : index === 1
                          ? "Measuring impact, confidence, and downside"
                          : "Turning the strongest evidence into clear actions"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-8 border-t border-[#e2ded5] pt-4 text-xs leading-5 text-[#7a838c]">
              A fresh analysis is generated on every visit. This can take a few
              moments.
            </p>
          </div>
        </section>

        <section className="mt-8" aria-hidden="true">
          <div className="mb-5 h-10 w-64 rounded-xl bg-[#dedad0]" />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.62fr)]">
            <div className="space-y-4">
              <div className="loading-shimmer h-56 rounded-[1.25rem] border border-[#d9d5cb] bg-[#e7e3da]" />
              <div className="loading-shimmer h-56 rounded-[1.25rem] border border-[#d9d5cb] bg-[#e7e3da] [animation-delay:180ms]" />
            </div>
            <div className="loading-shimmer h-80 rounded-[1.35rem] border border-[#d9d5cb] bg-[#e7e3da] [animation-delay:320ms]" />
          </div>
        </section>

        <span className="sr-only">
          Generating your latest matchup analysis and recommendations.
        </span>
      </div>
    </main>
  );
}
