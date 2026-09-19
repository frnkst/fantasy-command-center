export default function Loading() {
  return (
    <main className="min-h-dvh bg-[#f2efe7] px-4 py-6 text-[#17202a] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[88rem] animate-pulse">
        <div className="h-10 w-64 rounded-full bg-[#dedad0]" />
        <div className="mt-14 grid gap-5 lg:grid-cols-[1.65fr_0.75fr]">
          <div className="h-[26rem] rounded-[1.6rem] bg-[#d8d6d2]" />
          <div className="h-[26rem] rounded-[1.6rem] bg-[#e5e1d8]" />
        </div>
        <div className="mt-6 h-80 rounded-[1.6rem] border border-[#d9d5cb] bg-[#e8e4dc]" />
      </div>
    </main>
  );
}
