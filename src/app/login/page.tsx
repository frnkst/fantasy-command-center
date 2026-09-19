import { Activity, Lock01, Shield01 } from "@untitledui/icons";
import { redirect } from "next/navigation";

import { signIn } from "@/app/actions";
import { LoginButton } from "@/components/login-button";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAuthenticated()) {
    redirect("/");
  }

  const { error } = await searchParams;

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#07110e] px-5 py-10 text-white">
      <div className="field-grid absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="absolute top-[-16rem] left-1/2 h-[34rem] w-[50rem] -translate-x-1/2 rounded-full bg-lime-300/10 blur-3xl" />
      <section className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#0e1d18]/92 p-7 shadow-[0_35px_90px_rgba(0,0,0,0.5)] sm:p-9">
        <div className="mb-16 flex items-center justify-between">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-lime-200/30 bg-lime-300 text-[#0a1713]">
            <Activity className="size-6" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-white/45 uppercase">
            <Shield01 className="size-4 text-lime-300" aria-hidden="true" />
            Private access
          </div>
        </div>

        <p className="font-score text-sm font-bold tracking-[0.22em] text-lime-300 uppercase">
          Fantasy command center
        </p>
        <h1 className="font-display mt-4 text-5xl leading-[0.93] font-black tracking-[-0.04em] sm:text-6xl">
          Win the week
          <br />
          before kickoff.
        </h1>
        <p className="mt-5 max-w-sm text-[0.95rem] leading-6 text-white/58">
          Your private matchup room for sharper starts, better waiver moves,
          and trades that make sense for both sides.
        </p>

        {error ? (
          <p
            className="mt-6 rounded-xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <form action={signIn} className="mt-9">
          <label
            htmlFor="password"
            className="font-score mb-2 block text-[0.65rem] font-bold tracking-[0.14em] text-white/45 uppercase"
          >
            Master password
          </label>
          <div className="mb-3 flex items-center rounded-xl border border-white/12 bg-black/16 px-4 focus-within:border-lime-300/60 focus-within:ring-2 focus-within:ring-lime-300/15">
            <Lock01 className="size-4 shrink-0 text-white/35" aria-hidden="true" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              autoFocus
              className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/25"
              placeholder="Enter your password"
            />
          </div>
          <LoginButton />
        </form>

        <p className="mt-5 text-center text-xs leading-5 text-white/35">
          The password stays on the server and is never stored in the browser.
        </p>
      </section>
    </main>
  );
}
