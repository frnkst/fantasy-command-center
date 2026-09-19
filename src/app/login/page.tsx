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
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#f2efe7] px-5 py-10 text-[#17202a]">
      <div className="field-grid absolute inset-0 opacity-70" aria-hidden="true" />
      <div className="absolute top-[-16rem] left-1/2 h-[34rem] w-[50rem] -translate-x-1/2 rounded-full bg-[#dce4ff] blur-3xl" />
      <section className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-[#d7d2c7] bg-[#fffdf8]/95 p-7 shadow-[0_32px_80px_rgba(44,49,57,0.13)] sm:p-9">
        <div className="mb-16 flex items-center justify-between">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#17202a] text-white">
            <Activity className="size-6" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#68727d]">
            <Shield01 className="size-4 text-[#2855d9]" aria-hidden="true" />
            Private access
          </div>
        </div>

        <p className="text-xs font-extrabold tracking-[0.06em] text-[#2855d9]">
          FANTASY COMMAND CENTER
        </p>
        <h1 className="font-display mt-4 text-5xl leading-[0.95] font-semibold tracking-[-0.04em] sm:text-6xl">
          Your smartest week starts here.
        </h1>
        <p className="mt-5 max-w-sm text-[0.95rem] leading-6 text-[#65707a]">
          A private decision desk for sharper starts, timely waiver moves, and
          trades grounded in your actual league.
        </p>

        {error ? (
          <p className="mt-6 rounded-xl border border-[#e7b8bb] bg-[#fcebec] px-4 py-3 text-sm text-[#96323a]" role="alert">
            {error}
          </p>
        ) : null}

        <form action={signIn} className="mt-9">
          <label
            htmlFor="password"
            className="mb-2 block text-xs font-bold text-[#626d78]"
          >
            Master password
          </label>
          <div className="mb-3 flex items-center rounded-xl border border-[#cbc6ba] bg-white px-4 focus-within:border-[#2855d9] focus-within:ring-2 focus-within:ring-[#2855d9]/15">
            <Lock01 className="size-4 shrink-0 text-[#7a838c]" aria-hidden="true" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              autoFocus
              className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm text-[#17202a] outline-none placeholder:text-[#9aa1a9]"
              placeholder="Enter your password"
            />
          </div>
          <LoginButton />
        </form>

        <p className="mt-5 text-center text-xs leading-5 text-[#7a838c]">
          The password stays on the server and is never stored in the browser.
        </p>
      </section>
    </main>
  );
}
