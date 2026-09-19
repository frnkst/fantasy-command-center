export default function Loading() {
  return (
    <main className="min-h-dvh bg-[#07110e] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[90rem] animate-pulse">
        <div className="h-10 w-64 rounded-xl bg-white/7" />
        <div className="mt-16 h-4 w-32 rounded bg-lime-300/15" />
        <div className="mt-4 h-20 max-w-3xl rounded-2xl bg-white/7" />
        <div className="mt-8 h-[34rem] rounded-2xl border border-white/8 bg-white/4" />
        <div className="mt-6 h-72 rounded-2xl border border-white/8 bg-white/4" />
      </div>
    </main>
  );
}
