"use client";

import { useState } from "react";
import { Plane, ArrowLeftRight, Users } from "lucide-react";
import FlightSearchPanel from "@/components/FlightSearchPanel";
import { CITY_TO_IATA } from "@/lib/flights";

const POPULAR_DESTINATIONS = [
  "도쿄", "오사카", "후쿠오카", "오키나와",
  "방콕", "푸켓", "다낭", "발리",
  "세부", "타이베이", "홍콩", "싱가포르",
  "괌", "하와이", "LA", "뉴욕",
  "파리", "런던", "이스탄불", "두바이",
];

const COMMON_ORIGINS = ["서울", "부산", "제주"];

export default function FlightsClient() {
  const [fromCity, setFromCity] = useState("서울");
  const [toCity, setToCity] = useState("");
  const [adults, setAdults] = useState(1);
  const [showPanel, setShowPanel] = useState(false);

  const handleSearch = () => {
    if (!toCity.trim()) return;
    setShowPanel(true);
  };

  const swapCities = () => {
    const tmp = fromCity;
    setFromCity(toCity);
    setToCity(tmp);
  };

  return (
    <div className="space-y-6">
      {/* 검색 폼 */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          {/* 출발지 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              <Plane className="w-3.5 h-3.5 inline -rotate-45 mr-1" />
              출발지
            </label>
            <input
              type="text"
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              list="origin-suggest"
              placeholder="예: 서울"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400"
            />
            <datalist id="origin-suggest">
              {COMMON_ORIGINS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <button
            type="button"
            onClick={swapCities}
            className="hidden sm:flex w-9 h-9 mb-1 items-center justify-center rounded-full border border-slate-200 hover:border-sky-300 hover:bg-sky-50 transition-colors"
            title="출발지 ↔ 도착지 교환"
          >
            <ArrowLeftRight className="w-4 h-4 text-slate-500" />
          </button>

          {/* 도착지 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              <Plane className="w-3.5 h-3.5 inline rotate-45 mr-1" />
              도착지
            </label>
            <input
              type="text"
              value={toCity}
              onChange={(e) => setToCity(e.target.value)}
              list="dest-suggest"
              placeholder="예: 도쿄"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
            <datalist id="dest-suggest">
              {Object.keys(CITY_TO_IATA)
                .filter((k) => /[가-힣]/.test(k))
                .map((c) => (
                  <option key={c} value={c} />
                ))}
            </datalist>
          </div>
        </div>

        {/* 인기 도착지 */}
        <div className="mt-4">
          <p className="text-[11px] text-slate-500 mb-2">인기 도착지</p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_DESTINATIONS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setToCity(c);
                  setShowPanel(true);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  toCity === c
                    ? "bg-sky-600 text-white border-sky-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-sky-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 인원 */}
        <div className="flex items-center gap-3 mt-4">
          <label className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            인원
          </label>
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAdults(Math.max(1, adults - 1))}
              className="w-7 h-7 rounded-md border border-slate-200 text-slate-600 hover:border-sky-300"
            >
              −
            </button>
            <span className="text-sm font-bold w-6 text-center">{adults}</span>
            <button
              type="button"
              onClick={() => setAdults(Math.min(9, adults + 1))}
              className="w-7 h-7 rounded-md border border-slate-200 text-slate-600 hover:border-sky-300"
            >
              +
            </button>
            <span className="text-xs text-slate-400">성인 (9명까지)</span>
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={!toCity.trim()}
          className="w-full mt-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-sky-500/20 transition-all"
        >
          가격 비교 시작
        </button>
      </div>

      {/* 결과 패널 */}
      {showPanel && toCity.trim() && (
        <FlightSearchPanel
          defaultFromCity={fromCity}
          toCity={toCity}
          adults={adults}
          days={3}
        />
      )}
    </div>
  );
}
