"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  MagicWand02,
  RefreshCw01,
  Repeat01,
  Stars02,
  UserPlus01,
} from "@untitledui/icons";
import { useMemo, useState, useSyncExternalStore } from "react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import type {
  DashboardViewData,
  PlayerView,
} from "@/lib/dashboard/view-model";
import {
  type RecommendationResponse,
  recommendationResponseSchema,
} from "@/lib/recommendations/schema";

const cachedResponseSchema = z.object({
  fingerprint: z.string(),
  generatedAt: z.string(),
  model: z.string(),
  recommendations: recommendationResponseSchema,
});

type CachedResponse = z.infer<typeof cachedResponseSchema>;

function subscribeToCache(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("fcc-recommendations-cache", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("fcc-recommendations-cache", callback);
  };
}

function formatPoints(points: number) {
  return points.toFixed(1);
}

function PlayerLine({
  player,
  direction,
}: {
  player: PlayerView;
  direction?: "up" | "down";
}) {
  const Icon = direction === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="flex min-w-0 items-center gap-3">
      {direction ? (
        <span
          className={
            direction === "up"
              ? "flex size-8 shrink-0 items-center justify-center rounded-lg bg-lime-300 text-[#0a1713]"
              : "flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/7 text-white/45"
          }
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{player.name}</p>
        <p className="mt-0.5 font-score text-[0.68rem] tracking-wide text-white/42 uppercase">
          {player.position} · {player.team}
          {player.opponent ? ` vs ${player.opponent}` : ""}
        </p>
        {player.recentAverage !== null ? (
          <p className="mt-1 text-[0.68rem] text-white/34">
            {player.recentAverage.toFixed(1)} avg over {player.recentGames} recent
            {player.trendCount ? ` · ${player.trendCount} adds / 48h` : ""}
          </p>
        ) : player.trendCount ? (
          <p className="mt-1 text-[0.68rem] text-white/34">
            {player.trendCount} Sleeper adds / 48h
          </p>
        ) : null}
      </div>
      <span className="font-score ml-auto text-sm font-bold text-white/76">
        {formatPoints(player.projectedPoints)}
      </span>
    </div>
  );
}

function EmptyAdvice({ children }: { children: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/12 px-4 py-7 text-center text-sm text-white/42">
      {children}
    </div>
  );
}

function RecommendationMeta({
  advice,
}: {
  advice: RecommendationResponse["lineup"][number];
}) {
  return (
    <>
      <p className="mt-4 text-sm leading-6 text-white/66">{advice.rationale}</p>
      <div className="mt-4 flex items-start gap-2 border-t border-white/8 pt-3 text-xs leading-5 text-amber-100/65">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {advice.risk}
      </div>
    </>
  );
}

export function RecommendationWorkspace({
  dashboard,
}: {
  dashboard: DashboardViewData;
}) {
  const storageKey = `fcc:recommendations:${dashboard.fingerprint}`;
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const cachedRaw = useSyncExternalStore(
    subscribeToCache,
    () => localStorage.getItem(storageKey),
    () => null,
  );
  const cached = useMemo<CachedResponse | null>(() => {
    if (!cachedRaw) return null;
    try {
      const parsed = cachedResponseSchema.safeParse(JSON.parse(cachedRaw));
      if (parsed.success && parsed.data.fingerprint === dashboard.fingerprint) {
        return parsed.data;
      }
    } catch {
      return null;
    }
    return null;
  }, [cachedRaw, dashboard.fingerprint]);

  const lookup = useMemo(
    () => ({
      lineup: new Map(
        dashboard.candidates.lineup.map((candidate) => [candidate.id, candidate]),
      ),
      waivers: new Map(
        dashboard.candidates.waivers.map((candidate) => [candidate.id, candidate]),
      ),
      trades: new Map(
        dashboard.candidates.trades.map((candidate) => [candidate.id, candidate]),
      ),
    }),
    [dashboard.candidates],
  );

  async function generate() {
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint: dashboard.fingerprint }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "The game plan could not be generated.";
        throw new Error(message);
      }
      const parsed = cachedResponseSchema.parse(payload);
      localStorage.setItem(storageKey, JSON.stringify(parsed));
      window.dispatchEvent(new Event("fcc-recommendations-cache"));
      setStatus("idle");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The game plan could not be generated.",
      );
      setStatus("error");
    }
  }

  const advice = cached?.recommendations;

  return (
    <section className="mt-6" aria-labelledby="game-plan-title">
      <Panel className="overflow-hidden border-lime-200/12">
        <div className="relative border-b border-white/8 px-5 py-6 sm:px-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(190,242,100,0.13),transparent_38%)]" />
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Stars02 className="size-5 text-lime-300" aria-hidden="true" />
                <p className="font-score text-xs font-bold tracking-[0.16em] text-lime-300 uppercase">
                  AI game plan
                </p>
              </div>
              <h2
                id="game-plan-title"
                className="font-display mt-2 text-3xl font-extrabold tracking-tight"
              >
                Turn the matchup into moves.
              </h2>
              <p className="mt-1 text-sm text-white/45">
                Grounded in Sleeper projections. Generated only when you ask.
              </p>
            </div>
            <Button onClick={generate} disabled={status === "loading"}>
              {status === "loading" ? (
                <RefreshCw01 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <MagicWand02 className="size-4" aria-hidden="true" />
              )}
              {status === "loading"
                ? "Building game plan…"
                : cached
                  ? "Regenerate"
                  : "Generate game plan"}
            </Button>
          </div>
          {error ? (
            <p className="relative mt-4 rounded-xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
              {error}
            </p>
          ) : null}
        </div>

        {advice ? (
          <>
            <div className="grid gap-px bg-white/8 lg:grid-cols-[1fr_auto]">
              <div className="bg-[#0d1d17] px-5 py-6 sm:px-7">
                <Badge tone="positive">{advice.outlook.replace("_", " ")}</Badge>
                <p className="mt-4 max-w-3xl text-lg leading-7 text-white/82">
                  {advice.summary}
                </p>
              </div>
              <div className="flex min-w-44 items-center gap-4 bg-[#0d1d17] px-5 py-5 lg:flex-col lg:justify-center">
                <span className="font-display text-5xl font-black text-lime-300">
                  {advice.confidence}
                </span>
                <span className="font-score text-[0.62rem] leading-4 tracking-[0.14em] text-white/38 uppercase">
                  confidence
                  <br />
                  index
                </span>
              </div>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-3 lg:p-6">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Repeat01 className="size-4 text-lime-300" aria-hidden="true" />
                  <h3 className="font-score text-xs font-bold tracking-[0.13em] uppercase">
                    Start / sit
                  </h3>
                </div>
                <div className="space-y-3">
                  {advice.lineup.length ? (
                    advice.lineup.map((item) => {
                      const candidate = lookup.lineup.get(item.candidateId);
                      if (!candidate) return null;
                      return (
                        <article
                          key={item.candidateId}
                          className="rounded-xl border border-white/9 bg-black/12 p-4"
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <span className="font-score text-[0.62rem] font-bold tracking-[0.14em] text-lime-300 uppercase">
                              Start this week
                            </span>
                            <Badge tone="positive">
                              +{candidate.projectedGain.toFixed(1)} pts
                            </Badge>
                          </div>
                          <PlayerLine player={candidate.start} direction="up" />
                          <p className="font-score mt-4 mb-2 text-[0.62rem] font-bold tracking-[0.14em] text-white/32 uppercase">
                            Move to bench
                          </p>
                          <PlayerLine player={candidate.sit} direction="down" />
                          <RecommendationMeta advice={item} />
                        </article>
                      );
                    })
                  ) : (
                    <EmptyAdvice>Your current lineup already grades best.</EmptyAdvice>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <UserPlus01 className="size-4 text-lime-300" aria-hidden="true" />
                  <h3 className="font-score text-xs font-bold tracking-[0.13em] uppercase">
                    Waiver wire
                  </h3>
                </div>
                <div className="space-y-3">
                  {advice.waivers.length ? (
                    advice.waivers.map((item) => {
                      const candidate = lookup.waivers.get(item.candidateId);
                      if (!candidate) return null;
                      return (
                        <article
                          key={item.candidateId}
                          className="rounded-xl border border-white/9 bg-black/12 p-4"
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <span className="font-score text-[0.62rem] font-bold tracking-[0.14em] text-lime-300 uppercase">
                              Add from waivers
                            </span>
                            <Badge tone="positive">
                              +{candidate.projectedGain.toFixed(1)} pts
                            </Badge>
                          </div>
                          <PlayerLine player={candidate.add} direction="up" />
                          <p className="font-score mt-4 mb-2 text-[0.62rem] font-bold tracking-[0.14em] text-white/32 uppercase">
                            Drop
                          </p>
                          <PlayerLine player={candidate.drop} direction="down" />
                          <RecommendationMeta advice={item} />
                        </article>
                      );
                    })
                  ) : (
                    <EmptyAdvice>No clear add-drop upgrade was found.</EmptyAdvice>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <RefreshCw01 className="size-4 text-lime-300" aria-hidden="true" />
                  <h3 className="font-score text-xs font-bold tracking-[0.13em] uppercase">
                    Trade desk
                  </h3>
                </div>
                <div className="space-y-3">
                  {advice.trades.length ? (
                    advice.trades.map((item) => {
                      const candidate = lookup.trades.get(item.candidateId);
                      if (!candidate) return null;
                      return (
                        <article
                          key={item.candidateId}
                          className="rounded-xl border border-white/9 bg-black/12 p-4"
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <span className="font-score text-[0.62rem] font-bold tracking-[0.14em] text-lime-300 uppercase">
                              Receive
                            </span>
                            <span className="text-xs text-white/40">
                              from {candidate.partnerName}
                            </span>
                          </div>
                          <PlayerLine player={candidate.receive} direction="up" />
                          <p className="font-score mt-4 mb-2 text-[0.62rem] font-bold tracking-[0.14em] text-white/32 uppercase">
                            Send
                          </p>
                          <PlayerLine player={candidate.give} direction="down" />
                          <RecommendationMeta advice={item} />
                        </article>
                      );
                    })
                  ) : (
                    <EmptyAdvice>No mutually useful 1-for-1 deal was found.</EmptyAdvice>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-white/8 px-5 py-4 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <span className="flex items-center gap-2">
                <Clock className="size-3.5" aria-hidden="true" />
                Generated {new Date(cached.generatedAt).toLocaleString()}
              </span>
              <span className="truncate">Model: {cached.model}</span>
            </div>
          </>
        ) : (
          <div className="p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["01", "Lineup", `${dashboard.candidates.lineup.length} actual changes`],
                ["02", "Waivers", `${dashboard.candidates.waivers.length} add-drop options`],
                ["03", "Trades", `${dashboard.candidates.trades.length} balanced deals`],
              ].map(([number, label, detail]) => (
                <div
                  key={number}
                  className="rounded-xl border border-white/8 bg-black/10 p-4"
                >
                  <span className="font-score text-xs text-lime-300">{number}</span>
                  <p className="mt-8 font-display text-2xl font-bold">{label}</p>
                  <p className="mt-1 text-sm text-white/38">{detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/8 pt-5">
              <span className="mr-1 text-xs text-white/32">Evidence:</span>
              {dashboard.dataSources.map((source) => (
                <Badge key={source}>{source}</Badge>
              ))}
            </div>
          </div>
        )}
      </Panel>
    </section>
  );
}
