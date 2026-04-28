"use client";

import { useState } from "react";
import { Plane, ArrowRight, ExternalLink, Calendar, Users } from "lucide-react";
import { buildSearchUrls, resolveIata } from "@/lib/flights";

interface Props {
  /** 기본 출발지 (사용자가 변경 가능) */
  defaultFromCity?: string;
  /** 도착지 — 일정에서 자동 추출 */
  toCity: string;
  /** 출발일 YYYY-MM-DD (없으면 사용자가 입력) */
  departDate?: string;
  /** 귀국일 YYYY-MM-DD (없으면 days로 자동 계산) */
  returnDate?: string | null;
  /** 여행 일수 (departDate + days = returnDate 자동 계산용) */
  days?: number;
  /** 인원 */
  adults?: number;
  /** 컴팩트 모드 */
  compact?: boolean;
}

/** YYYY-MM-DD → +N일 후 YYYY-MM-DD */
function addDays(yyyymmdd: string, n: number): string {
  const d = new Date(yyyymmdd + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("sv-SE"); // YYYY-MM-DD
}

/** 오늘 + N일 (KST 기준 input default 용) */
function todayPlus(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("sv-SE");
}

/**
 * 항공권 메타서치 패널 — 두 Affiliate(Trip.com + Skyscanner) 동시 redirect
 * 직접 발권 ❌ — 외부 사이트에서 결제, 우리는 commission 수령
 */
export default function FlightSearchPanel({
  defaultFromCity = "서울",
  toCity,
  departDate: initialDepart,
  returnDate: initialReturn,
  days,
  adults = 1,
  compact = false,
}: Props) {
  const [fromCity, setFromCity] = useState(defaultFromCity);
  const [editing, setEditing] = useState(false);

  // 출발일이 없으면 오늘+30일 디폴트
  const [departDate, setDepartDate] = useState<string>(
    initialDepart ?? todayPlus(30)
  );
  // 귀국일: 명시값 > departDate + days > departDate + 3
  const computedReturn =
    initialReturn ?? (days ? addDays(departDate, days) : addDays(departDate, 3));
  const [returnDate, setReturnDate] = useState<string>(computedReturn);
  const [oneWay, setOneWay] = useState(false);

  // departDate가 바뀌면 귀국일도 days 만큼 자동 따라감 (사용자가 직접 바꾸기 전까지)
  const handleDepartChange = (v: string) => {
    setDepartDate(v);
    if (days && !initialReturn) {
      setReturnDate(addDays(v, days));
    } else if (!initialReturn) {
      setReturnDate(addDays(v, 3));
    }
  };

  const fromIata = resolveIata(fromCity);
  const toIata = resolveIata(toCity);

  const urls = buildSearchUrls({
    fromCity,
    toCity,
    departDate,
    returnDate: oneWay ? null : returnDate,
    adults,
  });

  return (
    <div
      className={`bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-3xl ${
        compact ? "p-5" : "p-6"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center">
          <Plane className="w-4 h-4 -rotate-12" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm">
            이 일정에 맞는 항공편 찾기
          </h3>
          <p className="text-[11px] text-slate-500">
            메타서치로 가격 비교 — 외부 사이트에서 예약
          </p>
        </div>
      </div>

      {/* 출발-도착 도시 */}
      <div className="bg-white rounded-2xl p-3 mb-3 border border-sky-100">
        <div className="flex items-center gap-2 text-sm">
          {editing ? (
            <input
              type="text"
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              onBlur={() => setEditing(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setEditing(false);
                }
              }}
              autoFocus
              className="px-2 py-1 border border-slate-300 rounded-md text-sm w-28 outline-none focus:border-sky-400"
              placeholder="출발 도시"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="font-bold text-slate-900 hover:text-sky-600"
              title="클릭하여 변경"
            >
              {fromCity}{" "}
              <span className="text-[10px] text-slate-400">{fromIata}</span>
            </button>
          )}
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-900">
            {toCity}{" "}
            <span className="text-[10px] text-slate-400">{toIata}</span>
          </span>
        </div>

        {/* 날짜 + 인원 */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              출발일
            </label>
            <input
              type="date"
              value={departDate}
              onChange={(e) => handleDepartChange(e.target.value)}
              min={todayPlus(0)}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-sky-400"
            />
          </div>
          <div className={oneWay ? "opacity-40 pointer-events-none" : ""}>
            <label className="text-[10px] text-slate-500 block mb-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              귀국일
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              min={departDate}
              disabled={oneWay}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-sky-400 disabled:bg-slate-50"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <label className="text-xs text-slate-600 inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={oneWay}
              onChange={(e) => setOneWay(e.target.checked)}
              className="rounded"
            />
            편도
          </label>
          <span className="text-xs text-slate-500 inline-flex items-center gap-1">
            <Users className="w-3 h-3" />
            성인 {adults}명
          </span>
        </div>
      </div>

      {/* 두 Provider 버튼 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <a
          href={urls.tripcom}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="group flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 hover:-translate-y-0.5 transition-all shadow-sm"
        >
          <span className="flex items-center gap-2">
            <span className="text-xs opacity-80">Trip.com</span>
            <span>가격 비교 →</span>
          </span>
          <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        </a>
        <a
          href={urls.skyscanner}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="group flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 hover:-translate-y-0.5 transition-all shadow-sm"
        >
          <span className="flex items-center gap-2">
            <span className="text-xs opacity-80">Skyscanner</span>
            <span>가격 비교 →</span>
          </span>
          <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        </a>
      </div>

      <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
        Pothos는 항공권 판매업체가 아닌 정보 제공 플랫폼입니다. 결제·예약은 위
        제휴 사이트에서 진행되며, Pothos는 commission을 수령할 수 있습니다.
      </p>
    </div>
  );
}
