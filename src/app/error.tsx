"use client";

import { AlertTriangle, RefreshCw01 } from "@untitledui/icons";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-[#07110e] px-5 text-white">
      <section className="max-w-md rounded-2xl border border-white/10 bg-[#0d1d17] p-7">
        <span className="flex size-11 items-center justify-center rounded-xl bg-amber-300/12 text-amber-200">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <p className="font-score mt-8 text-xs font-bold tracking-[0.16em] text-amber-200 uppercase">
          Data feed unavailable
        </p>
        <h1 className="font-display mt-2 text-4xl font-black">
          The matchup board is offline.
        </h1>
        <p className="mt-4 text-sm leading-6 text-white/50">
          Check the Sleeper configuration and try again. The dashboard will
          never replace missing data with invented recommendations.
        </p>
        <Button className="mt-7" onClick={reset}>
          <RefreshCw01 className="size-4" aria-hidden="true" />
          Try again
        </Button>
      </section>
    </main>
  );
}
