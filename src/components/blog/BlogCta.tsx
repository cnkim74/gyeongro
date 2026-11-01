import Link from "next/link";

/** 글 아래·목록 아래 행동 유도 박스 */
export default function BlogCta({ variant = "card" }: { variant?: "card" | "band" }) {
  if (variant === "band") {
    return (
      <section className="bg-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-6 py-16 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">읽었다면, 이제 떠날 차례.</h2>
          <p className="mt-3 text-slate-400">목적지와 날짜만 알려주시면 실제 갈 수 있는 일정을 AI가 짜드려요.</p>
          <Link
            href="/planner"
            className="mt-8 inline-flex items-center px-7 py-3.5 rounded-full bg-white text-slate-900 font-bold hover:bg-slate-100"
          >
            AI로 여행 일정 만들기
          </Link>
        </div>
      </section>
    );
  }
  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-blue-950 text-white p-7 sm:p-9">
      <p className="text-xs font-bold tracking-widest text-blue-300">POTHOS</p>
      <p className="mt-2 text-2xl font-extrabold leading-snug">
        이 여행, 바로 일정으로 만들어 볼까요?
        <br className="hidden sm:block" /> 장소·동선·예산까지 한 번에 정리해 드려요.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/planner" className="px-5 py-3 rounded-full bg-white text-slate-900 text-[15px] font-bold hover:bg-slate-100">
          AI 일정 만들기
        </Link>
        <Link
          href="/festivals"
          className="px-5 py-3 rounded-full border border-white/30 text-white text-[15px] font-bold hover:bg-white/10"
        >
          축제·박람회 보기
        </Link>
      </div>
    </div>
  );
}
