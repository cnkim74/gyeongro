"use client";

// 해외 축제·박람회 카드 — 앞면: 대표 사진 + 지마켓 산스 제목 / 뒷면: 설명·일정·버튼
// 마우스를 올리면 뒤집히고(마우스가 있는 기기), 휴대폰은 탭하면 뒤집혀요.
// 움직임 줄이기 설정을 켠 사용자에게는 회전 대신 서서히 바뀌어요.
import { useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, RotateCcw, Search, Sparkles } from "lucide-react";
import type { GlobalFestival } from "@/lib/global-festivals";

const AUDIENCE: Record<string, { text: string; cls: string }> = {
  trade: { text: "업계 관계자 전용", cls: "bg-gray-100 text-gray-700" },
  mixed: { text: "일부 일반 공개", cls: "bg-violet-50 text-violet-700" },
  public: { text: "일반 관람 가능", cls: "bg-blue-50 text-blue-700" },
};

export default function FestivalFlipCard({ f, cta, dateLabel }: { f: GlobalFestival; cta: string; dateLabel: string }) {
  const [flipped, setFlipped] = useState(false);
  const audience = f.audience ? AUDIENCE[f.audience] : null;

  return (
    <div className="group h-[430px] [perspective:1400px]">
      <div
        className={`relative h-full w-full rounded-3xl transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)] [transform-style:preserve-3d] motion-reduce:transition-none group-hover:[transform:rotateY(180deg)] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* 앞면 */}
        <button
          type="button"
          onClick={() => setFlipped(true)}
          aria-label={`${f.name} 자세히 보기`}
          className={`absolute inset-0 overflow-hidden rounded-3xl text-left shadow-[0_14px_36px_-16px_rgba(15,23,42,0.55)] [backface-visibility:hidden] group-hover:pointer-events-none ${
            flipped ? "pointer-events-none" : ""
          }`}
        >
          {f.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-200 via-rose-200 to-violet-300">
              <span className="text-[110px] drop-shadow-sm">{f.emoji}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-gray-800 backdrop-blur">
              {f.flag} {f.country}
            </span>
            {audience && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${audience.cls}`}>{audience.text}</span>}
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <p className="flex items-center gap-1 text-sm font-semibold text-white/85">
              <MapPin className="h-3.5 w-3.5" /> {f.city}
            </p>
            <h3 className="mt-1 font-title text-[26px] font-bold leading-[1.2] [text-shadow:0_2px_12px_rgba(0,0,0,.35)]">{f.name}</h3>
            {f.nameEn && <p className="mt-1 text-sm text-white/70">{f.nameEn}</p>}
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold backdrop-blur">
              <CalendarDays className="h-4 w-4" /> {dateLabel}
            </p>
          </div>
        </button>

        {/* 뒷면 */}
        <div className="absolute inset-0 flex flex-col overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-6 shadow-[0_14px_36px_-16px_rgba(249,115,22,0.45)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-gray-500">
              {f.flag} {f.country} · {f.city}
            </p>
            <button
              type="button"
              onClick={() => setFlipped(false)}
              aria-label="앞면으로"
              className="-mr-1 -mt-1 rounded-full p-1.5 text-gray-400 hover:bg-white hover:text-gray-700"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          <h3 className="mt-1 font-title text-xl font-bold leading-snug text-gray-900">
            {f.emoji} {f.name}
          </h3>
          <p className="mt-3 flex items-center gap-1.5 text-[15px] font-semibold text-rose-600">
            <CalendarDays className="h-4 w-4" /> {dateLabel}
          </p>
          {audience && <span className={`mt-2 self-start rounded-full px-2.5 py-0.5 text-xs font-bold ${audience.cls}`}>{audience.text}</span>}
          <p className="mt-3 flex-1 overflow-y-auto text-[15px] leading-relaxed text-gray-700">{f.summary}</p>
          <div className="mt-4 flex gap-2">
            <Link
              href={`/planner?gfest=${f.id}`}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 py-3 text-[15px] font-bold text-white"
            >
              <Sparkles className="h-4 w-4" /> {cta}
            </Link>
            {f.sourceUrl ? (
              <a
                href={f.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700"
                title="개최일 출처"
              >
                출처
              </a>
            ) : (
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(`${f.nameEn} ${new Date().getFullYear()} dates`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 text-gray-700"
                title="올해 개최일 검색"
              >
                <Search className="h-5 w-5" />
              </a>
            )}
          </div>
          {f.image && f.imageCredit && (
            <a
              href={f.imageCreditUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 truncate text-[10px] text-gray-400 hover:text-gray-600"
              title={f.imageCredit}
            >
              사진: {f.imageCredit}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
