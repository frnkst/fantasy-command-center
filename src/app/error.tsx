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
    <main className="grid min-h-dvh place-items-center bg-[#f2efe7] px-5 text-[#17202a]">
      <section className="max-w-md rounded-[1.5rem] border border-[#d9d5cb] bg-[#fffdf8] p-7 shadow-[0_20px_50px_rgba(37,43,52,0.08)]">
        <span className="flex size-11 items-center justify-center rounded-full bg-[#fff0e6] text-[#b55423]">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-8 text-xs font-extrabold tracking-[0.04em] text-[#b55423]">
          DATA FEED UNAVAILABLE
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-[-0.025em]">
          The decision desk is offline.
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#65707a]">
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
