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
  LineupCandidateView,
  PlayerView,
  TradeCandidateView,
  WaiverCandidateView,
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
  telegram: z
    .object({
      status: z.enum(["sent", "not_configured", "failed"]),
    })
    .optional(),
});

type CachedResponse = z.infer<typeof cachedResponseSchema>;
type RecommendationItem = RecommendationResponse["lineup"][number];

function subscribeToCache(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("fcc-recommendations-cache", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("fcc-recommendations-cache", callback);
  };
}

function PlayerLine({
  player,
  direction,
}: {
  player: PlayerView;
  direction: "up" | "down";
}) {
  const Icon = direction === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className={
          direction === "up"
            ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e8edff] text-[#2855d9]"
            : "flex size-9 shrink-0 items-center justify-center rounded-full bg-[#edf0f2] text-[#68737f]"
        }
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-[#17202a]">
          {player.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-[#707a84]">
          {player.position} · {player.team}
          {player.opponent ? ` vs ${player.opponent}` : ""}
          {player.injuryStatus ? ` · ${player.injuryStatus}` : ""}
        </p>
      </div>
      <span className="ml-auto text-sm font-extrabold text-[#35404b]">
        {player.projectedPoints.toFixed(1)}
      </span>
    </div>
  );
}

function PlayerComparison({
  primary,
  secondary,
  primaryLabel,
  secondaryLabel,
}: {
  primary: PlayerView;
  secondary: PlayerView;
  primaryLabel: string;
  secondaryLabel: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <p className="mb-2 text-[0.68rem] font-extrabold tracking-[0.04em] text-[#2855d9]">
          {primaryLabel.toUpperCase()}
        </p>
        <PlayerLine player={primary} direction="up" />
      </div>
      <div>
        <p className="mb-2 text-[0.68rem] font-extrabold tracking-[0.04em] text-[#747d87]">
          {secondaryLabel.toUpperCase()}
        </p>
        <PlayerLine player={secondary} direction="down" />
      </div>
    </div>
  );
}

function Evidence({
  primary,
  secondary,
}: {
  primary: PlayerView;
  secondary: PlayerView;
}) {
  const facts = [
    `${primary.projectedPoints.toFixed(1)} vs ${secondary.projectedPoints.toFixed(1)} projected points`,
    primary.recentAverage !== null
      ? `${primary.recentAverage.toFixed(1)} recent average over ${primary.recentGames} game${primary.recentGames === 1 ? "" : "s"}`
      : null,
    primary.addTrendCount
      ? `${primary.addTrendCount} Sleeper adds in 48 hours`
      : secondary.dropTrendCount
        ? `${secondary.dropTrendCount} Sleeper drops in 48 hours`
        : null,
  ].filter((fact): fact is string => Boolean(fact));

  return (
    <div className="mt-5 grid gap-2 border-t border-[#e3dfd6] pt-4 sm:grid-cols-3">
      {facts.map((fact) => (
        <div
          key={fact}
          className="rounded-xl bg-[#f3f1eb] px-3 py-2.5 text-xs leading-5 text-[#596570]"
        >
          {fact}
        </div>
      ))}
    </div>
  );
}

function RecommendationContext({
  advice,
  primary,
  secondary,
}: {
  advice: RecommendationItem;
  primary: PlayerView;
  secondary: PlayerView;
}) {
  return (
    <>
      <Evidence primary={primary} secondary={secondary} />
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <p className="text-[0.68rem] font-extrabold tracking-[0.04em] text-[#6b7580]">
            WHY IT HELPS
          </p>
          <p className="mt-1.5 text-sm leading-6 text-[#46515d]">
            {advice.rationale}
          </p>
        </div>
        <div className="rounded-xl border border-[#edcbb8] bg-[#fff4ec] px-3.5 py-3">
          <p className="flex items-center gap-2 text-[0.68rem] font-extrabold tracking-[0.04em] text-[#a94c20]">
            <AlertTriangle className="size-3.5" aria-hidden="true" />
            WHAT COULD GO WRONG
          </p>
          <p className="mt-1.5 text-xs leading-5 text-[#7e503a]">{advice.risk}</p>
        </div>
      </div>
    </>
  );
}

function DecisionHeader({
  rank,
  label,
  title,
  gain,
  advice,
}: {
  rank: number;
  label: string;
  title: string;
  gain: number | null;
  advice: RecommendationItem;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex min-w-0 gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#17202a] text-xs font-extrabold text-white">
          {rank}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.68rem] font-extrabold tracking-[0.04em] text-[#2855d9]">
              {label.toUpperCase()}
            </span>
            <Badge
              tone={
                advice.strength === "high"
                  ? "positive"
                  : advice.strength === "medium"
                    ? "warning"
                    : "neutral"
              }
            >
              {advice.strength} confidence
            </Badge>
          </div>
          <h3 className="font-display mt-1.5 text-2xl leading-tight font-semibold tracking-[-0.02em] text-[#17202a]">
            {title}
          </h3>
        </div>
      </div>
      {gain !== null ? (
        <div className="shrink-0 text-right">
          <p className="text-xl font-extrabold text-[#176b4d]">
            {gain >= 0 ? "+" : ""}
            {gain.toFixed(1)}
          </p>
          <p className="text-[0.68rem] font-semibold text-[#75808a]">
            projected pts
          </p>
        </div>
      ) : null}
    </div>
  );
}

function EmptyAdvice({ children }: { children: string }) {
  return (
    <div className="rounded-[1.2rem] border border-dashed border-[#cbc6ba] bg-[#faf8f3] px-5 py-7 text-center text-sm text-[#68727d]">
      {children}
    </div>
  );
}

type RankedDecision =
  | {
      kind: "lineup";
      advice: RecommendationItem;
      candidate: LineupCandidateView;
    }
  | {
      kind: "waiver";
      advice: RecommendationItem;
      candidate: WaiverCandidateView;
    }
  | {
      kind: "trade";
      advice: RecommendationItem;
      candidate: TradeCandidateView;
    };

function DecisionCard({
  decision,
  rank,
}: {
  decision: RankedDecision;
  rank: number;
}) {
  if (decision.kind === "lineup") {
    const { advice, candidate } = decision;
    return (
      <article className="rounded-[1.25rem] border border-[#d9d5cb] bg-[#fffdf8] p-5 sm:p-6">
        <DecisionHeader
          rank={rank}
          label="Lineup"
          title={`Start ${candidate.start.name}; bench ${candidate.sit.name}`}
          gain={candidate.projectedGain}
          advice={advice}
        />
        <PlayerComparison
          primary={candidate.start}
          secondary={candidate.sit}
          primaryLabel="Start"
          secondaryLabel="Bench"
        />
        <RecommendationContext
          advice={advice}
          primary={candidate.start}
          secondary={candidate.sit}
        />
      </article>
    );
  }

  if (decision.kind === "waiver") {
    const { advice, candidate } = decision;
    return (
      <article className="rounded-[1.25rem] border border-[#d9d5cb] bg-[#fffdf8] p-5 sm:p-6">
        <DecisionHeader
          rank={rank}
          label="Waiver wire"
          title={`Add ${candidate.add.name}; drop ${candidate.drop.name}`}
          gain={candidate.projectedGain}
          advice={advice}
        />
        <PlayerComparison
          primary={candidate.add}
          secondary={candidate.drop}
          primaryLabel="Add"
          secondaryLabel="Drop"
        />
        <RecommendationContext
          advice={advice}
          primary={candidate.add}
          secondary={candidate.drop}
        />
      </article>
    );
  }

  const { advice, candidate } = decision;
  return (
    <article className="rounded-[1.25rem] border border-[#d9d5cb] bg-[#fffdf8] p-5 sm:p-6">
      <DecisionHeader
        rank={rank}
        label="Trade idea"
        title={`Offer ${candidate.give.name} for ${candidate.receive.name}`}
        gain={candidate.myProjectedGain}
        advice={advice}
      />
      <p className="-mt-3 mb-5 text-xs text-[#707a84]">
        Potential partner: {candidate.partnerName} · Their projected gain: +
        {candidate.partnerProjectedGain.toFixed(1)}
      </p>
      <PlayerComparison
        primary={candidate.receive}
        secondary={candidate.give}
        primaryLabel="Receive"
        secondaryLabel="Send"
      />
      <RecommendationContext
        advice={advice}
        primary={candidate.receive}
        secondary={candidate.give}
      />
    </article>
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

  const decisions = useMemo(() => {
    if (!cached) return [];
    const ranked: RankedDecision[] = [];
    for (const advice of cached.recommendations.lineup) {
      const candidate = lookup.lineup.get(advice.candidateId);
      if (candidate) ranked.push({ kind: "lineup", advice, candidate });
    }
    for (const advice of cached.recommendations.waivers) {
      const candidate = lookup.waivers.get(advice.candidateId);
      if (candidate) ranked.push({ kind: "waiver", advice, candidate });
    }
    for (const advice of cached.recommendations.trades) {
      const candidate = lookup.trades.get(advice.candidateId);
      if (candidate) ranked.push({ kind: "trade", advice, candidate });
    }
    return ranked.sort(
      (a, b) =>
        a.advice.priority - b.advice.priority ||
        b.advice.confidence - a.advice.confidence,
    ).slice(0, 5);
  }, [cached, lookup]);

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
  const candidateCounts = [
    {
      label: "Lineup",
      detail: `${dashboard.candidates.lineup.length} verified change${dashboard.candidates.lineup.length === 1 ? "" : "s"}`,
      icon: Repeat01,
    },
    {
      label: "Waivers",
      detail: `${dashboard.candidates.waivers.length} legal add-drop option${dashboard.candidates.waivers.length === 1 ? "" : "s"}`,
      icon: UserPlus01,
    },
    {
      label: "Trades",
      detail: `${dashboard.candidates.trades.length} mutually useful idea${dashboard.candidates.trades.length === 1 ? "" : "s"}`,
      icon: RefreshCw01,
    },
  ];

  return (
    <section
      id="decisions"
      className="mt-10 scroll-mt-6"
      aria-labelledby="game-plan-title"
    >
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <Stars02 className="size-4 text-[#2855d9]" aria-hidden="true" />
            <p className="text-xs font-extrabold text-[#2855d9]">Decision desk</p>
          </div>
          <h2
            id="game-plan-title"
            className="font-display mt-1 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl"
          >
            Your next best moves
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65707a]">
            Legal options are calculated first. AI ranks and explains only
            those grounded candidates, including the evidence against each move.
          </p>
        </div>
        {cached ? (
          <Button onClick={generate} disabled={status === "loading"}>
            {status === "loading" ? (
              <RefreshCw01 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <MagicWand02 className="size-4" aria-hidden="true" />
            )}
            {status === "loading"
              ? "Generating dashboard…"
              : "Generate dashboard"}
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-[#e7b8bb] bg-[#fcebec] px-4 py-3 text-sm text-[#96323a]">
          {error}
        </p>
      ) : null}

      {advice ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.62fr)]">
          <div className="space-y-4">
            {decisions.length ? (
              decisions.map((decision, index) => (
                <DecisionCard
                  key={`${decision.kind}:${decision.advice.candidateId}`}
                  decision={decision}
                  rank={index + 1}
                />
              ))
            ) : (
              <EmptyAdvice>
                No material move is recommended. Your current setup already
                grades best from the available evidence.
              </EmptyAdvice>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
            <Panel className="overflow-hidden">
              <div className="bg-[#17202a] p-5 text-white">
                <Badge className="border-white/15 bg-white/10 text-white">
                  {advice.outlook.replace("_", " ")}
                </Badge>
                <p className="font-display mt-5 text-3xl leading-[1.08] font-semibold tracking-[-0.025em]">
                  The analyst&apos;s read
                </p>
                <p className="mt-3 text-sm leading-6 text-white/67">
                  {advice.summary}
                </p>
              </div>
              <div className="p-5">
                <p className="text-[0.68rem] font-extrabold tracking-[0.04em] text-[#6d7781]">
                  PORTFOLIO RISKS
                </p>
                {advice.risks.length ? (
                  <ul className="mt-3 space-y-3">
                    {advice.risks.map((risk) => (
                      <li
                        key={risk}
                        className="flex gap-2 text-xs leading-5 text-[#59646f]"
                      >
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#d06a31]" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs leading-5 text-[#707a84]">
                    No additional cross-roster risks were identified.
                  </p>
                )}
              </div>
            </Panel>

            <div className="flex items-center gap-2 px-1 text-xs text-[#737d87]">
              <Clock className="size-3.5" aria-hidden="true" />
              Generated {new Date(cached.generatedAt).toLocaleString()}
            </div>
            {cached.telegram ? (
              <p
                className={
                  cached.telegram.status === "sent"
                    ? "px-1 text-xs text-[#176b4d]"
                    : "px-1 text-xs text-[#a4481c]"
                }
                role={cached.telegram.status === "failed" ? "alert" : undefined}
              >
                {cached.telegram.status === "sent"
                  ? "Telegram briefing delivered."
                  : cached.telegram.status === "not_configured"
                    ? "Telegram briefing is not configured."
                    : "Telegram briefing delivery failed."}
              </p>
            ) : null}
          </aside>
        </div>
      ) : (
        <Panel className="overflow-hidden">
          <div className="relative overflow-hidden border-b border-[#d9d5cb] px-5 py-10 text-center sm:px-8 sm:py-14">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(40,85,217,0.13),transparent_48%)]" />
            <div className="relative mx-auto max-w-xl">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#e8edff] text-[#2855d9]">
                <Stars02 className="size-5" aria-hidden="true" />
              </span>
              <h3 className="font-display mt-5 text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
                Turn this week&apos;s data into a clear plan.
              </h3>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#65707a]">
                Review the strongest lineup, waiver, and trade opportunities
                together—ranked by expected impact, confidence, and urgency.
              </p>
              <Button
                onClick={generate}
                disabled={status === "loading"}
                className="mt-6 min-w-52"
              >
                {status === "loading" ? (
                  <RefreshCw01
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <MagicWand02 className="size-4" aria-hidden="true" />
                )}
                {status === "loading"
                  ? "Generating dashboard…"
                  : "Generate dashboard"}
              </Button>
              <p className="mt-3 text-xs text-[#7b848d]">
                This also sends the briefing to Telegram when configured.
              </p>
            </div>
          </div>
          <div className="grid gap-px bg-[#d9d5cb] sm:grid-cols-3">
            {candidateCounts.map(({ label, detail, icon: Icon }) => (
              <div key={label} className="bg-[#fffdf8] p-5 sm:p-6">
                <span className="flex size-9 items-center justify-center rounded-full bg-[#e8edff] text-[#2855d9]">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <p className="font-display mt-7 text-2xl font-semibold">{label}</p>
                <p className="mt-1 text-sm text-[#69737e]">{detail}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t border-[#d9d5cb] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-[#707a84]">
              Evidence available for this dashboard
            </p>
            <div className="flex flex-wrap gap-2">
              {dashboard.dataSources.map((source) => (
                <Badge key={source}>{source}</Badge>
              ))}
            </div>
          </div>
        </Panel>
      )}
    </section>
  );
}
