"use client";

import { useState } from "react";
import { Sparkles, Calendar, ExternalLink } from "lucide-react";
import {
  buildActivitySearchUrls,
  preferEnglishActivity,
  ACTIVITY_CATEGORIES,
} from "@/lib/activities";

interface Props {
  /** 도착 도시 — 일정에서 자동 추출 */
  destination: string;
  /** 활동 날짜 (없으면 사용자가 입력) */
  date?: string | null;
  /** 컴팩트 모드 */
  compact?: boolean;
}

function todayPlus(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("sv-SE");
}

export default function ActivitySearchPanel({
  destination,
  date: initialDate,
  compact = false,
}: Props) {
  const [date, setDate] = useState<string>(initialDate ?? todayPlus(30));
  const [keyword, setKeyword] = useState<string>("");
  const [category, setCategory] = useState<string | null>(null);

  // 검색 키워드 합성: "도쿄 푸드 투어" 같은 자연어
  const englishDest = preferEnglishActivity(destination);
  const finalKeyword = keyword.trim()
    ? `${englishDest} ${keyword.trim()}`
    : category
    ? `${englishDest} ${ACTIVITY_CATEGORIES.find((c) => c.id === category)?.label ?? ""}`
    : englishDest;

  const urls = buildActivitySearchUrls({
    destination: finalKeyword,
    date,
    category: category ?? undefined,
  });

  return (
    <div
      className={`bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl ${
        compact ? "p-5" : "p-6"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm">
            현지 액티비티·투어 찾기
          </h3>
          <p className="text-[11px] text-slate-500">
            KKday · Klook · GetYourGuide 동시 비교
          </p>
        </div>
      </div>

      {/* 검색 박스 */}
      <div className="bg-white rounded-2xl p-3 mb-3 border border-amber-100">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-slate-900">{destination}</span>
          {englishDest !== destination && (
            <span className="text-[10px] text-slate-400">({englishDest})</span>
          )}
        </div>

        {/* 카테고리 칩 */}
        <div className="flex flex-wrap gap-1 mt-2">
          {ACTIVITY_CATEGORIES.map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(active ? null : c.id)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all ${
                  active
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                }`}
              >
                {c.emoji} {c.label}
              </button>
            );
          })}
        </div>

        {/* 키워드 (선택) + 날짜 */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 mt-3">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="추가 키워드 (선택, 예: 디즈니랜드, 호핑투어)"
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-amber-400"
          />
          <div className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={todayPlus(0)}
              className="px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* 3 Provider 버튼 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <a
          href={urls.kkday}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="group flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 hover:-translate-y-0.5 transition-all shadow-sm"
        >
          <span className="flex items-center gap-1.5">
            <span className="opacity-80 text-[10px]">KKday</span>
            <span>비교 →</span>
          </span>
          <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
        </a>
        <a
          href={urls.klook}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="group flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-red-500 text-white font-bold text-xs hover:bg-red-600 hover:-translate-y-0.5 transition-all shadow-sm"
        >
          <span className="flex items-center gap-1.5">
            <span className="opacity-80 text-[10px]">Klook</span>
            <span>비교 →</span>
          </span>
          <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
        </a>
        <a
          href={urls.getyourguide}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="group flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-pink-500 text-white font-bold text-xs hover:bg-pink-600 hover:-translate-y-0.5 transition-all shadow-sm"
        >
          <span className="flex items-center gap-1.5">
            <span className="opacity-80 text-[10px]">GYG</span>
            <span>비교 →</span>
          </span>
          <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
        </a>
      </div>

      <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
        Pothos는 액티비티 판매업체가 아닌 정보 제공 플랫폼입니다. 결제·예약은 위
        제휴 사이트에서 진행되며, Pothos는 commission을 수령할 수 있습니다.
      </p>
    </div>
  );
}
