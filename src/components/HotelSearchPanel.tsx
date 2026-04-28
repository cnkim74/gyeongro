"use client";

import { useState } from "react";
import {
  Hotel,
  Calendar,
  Users,
  BedDouble,
  ExternalLink,
} from "lucide-react";
import {
  buildHotelSearchUrls,
  nightsToCheckOut,
  preferEnglish,
} from "@/lib/hotels";

interface Props {
  /** 도착 도시 — 일정에서 자동 추출 */
  destination: string;
  /** 체크인 날짜 (없으면 사용자가 입력) */
  checkIn?: string;
  /** 체크아웃 날짜 (없으면 nights로 자동) */
  checkOut?: string | null;
  /** 박수 (체크인 + nights = 체크아웃) */
  nights?: number;
  /** 인원 (성인) */
  adults?: number;
  /** 컴팩트 모드 */
  compact?: boolean;
}

function todayPlus(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("sv-SE");
}

export default function HotelSearchPanel({
  destination,
  checkIn: initialCheckIn,
  checkOut: initialCheckOut,
  nights,
  adults: initialAdults = 2,
  compact = false,
}: Props) {
  const [checkIn, setCheckIn] = useState<string>(
    initialCheckIn ?? todayPlus(30)
  );
  const computedOut =
    initialCheckOut ??
    (nights ? nightsToCheckOut(checkIn, nights) : nightsToCheckOut(checkIn, 3));
  const [checkOut, setCheckOut] = useState<string>(computedOut);
  const [adults, setAdults] = useState(initialAdults);
  const [rooms, setRooms] = useState(1);

  const handleCheckInChange = (v: string) => {
    setCheckIn(v);
    if (!initialCheckOut) {
      setCheckOut(nightsToCheckOut(v, nights ?? 3));
    }
  };

  // Booking/Agoda 매칭률 위해 영문 우선
  const englishDest = preferEnglish(destination);

  const urls = buildHotelSearchUrls({
    destination: englishDest,
    checkIn,
    checkOut,
    adults,
    rooms,
  });

  const nightsCount = Math.max(
    0,
    Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
        86400000
    )
  );

  return (
    <div
      className={`bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-3xl ${
        compact ? "p-5" : "p-6"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center">
          <Hotel className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm">
            이 일정에 맞는 호텔 찾기
          </h3>
          <p className="text-[11px] text-slate-500">
            메타서치로 가격 비교 — 외부 사이트에서 예약
          </p>
        </div>
      </div>

      {/* 정보 박스 */}
      <div className="bg-white rounded-2xl p-3 mb-3 border border-violet-100">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-slate-900">{destination}</span>
          {englishDest !== destination && (
            <span className="text-[10px] text-slate-400">({englishDest})</span>
          )}
          <span className="ml-auto text-xs text-slate-500">
            {nightsCount}박 {nightsCount + 1}일
          </span>
        </div>

        {/* 날짜 */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              체크인
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => handleCheckInChange(e.target.value)}
              min={todayPlus(0)}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-violet-400"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              체크아웃
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-violet-400"
            />
          </div>
        </div>

        {/* 인원·객실 */}
        <div className="flex items-center gap-4 mt-3">
          <div className="inline-flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <label className="text-xs text-slate-600">성인</label>
            <button
              type="button"
              onClick={() => setAdults(Math.max(1, adults - 1))}
              className="w-6 h-6 rounded-md border border-slate-200 text-slate-600 hover:border-violet-300 text-xs"
            >
              −
            </button>
            <span className="text-xs font-bold w-5 text-center">{adults}</span>
            <button
              type="button"
              onClick={() => setAdults(Math.min(9, adults + 1))}
              className="w-6 h-6 rounded-md border border-slate-200 text-slate-600 hover:border-violet-300 text-xs"
            >
              +
            </button>
          </div>
          <div className="inline-flex items-center gap-2">
            <BedDouble className="w-3.5 h-3.5 text-slate-500" />
            <label className="text-xs text-slate-600">객실</label>
            <button
              type="button"
              onClick={() => setRooms(Math.max(1, rooms - 1))}
              className="w-6 h-6 rounded-md border border-slate-200 text-slate-600 hover:border-violet-300 text-xs"
            >
              −
            </button>
            <span className="text-xs font-bold w-5 text-center">{rooms}</span>
            <button
              type="button"
              onClick={() => setRooms(Math.min(5, rooms + 1))}
              className="w-6 h-6 rounded-md border border-slate-200 text-slate-600 hover:border-violet-300 text-xs"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* 3 Provider 버튼 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <a
          href={urls.tripcom}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="group flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 hover:-translate-y-0.5 transition-all shadow-sm"
        >
          <span className="flex items-center gap-1.5">
            <span className="opacity-80 text-[10px]">Trip.com</span>
            <span>비교 →</span>
          </span>
          <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
        </a>
        <a
          href={urls.booking}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="group flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950 hover:-translate-y-0.5 transition-all shadow-sm"
        >
          <span className="flex items-center gap-1.5">
            <span className="opacity-80 text-[10px]">Booking.com</span>
            <span>비교 →</span>
          </span>
          <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
        </a>
        <a
          href={urls.agoda}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="group flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 hover:-translate-y-0.5 transition-all shadow-sm"
        >
          <span className="flex items-center gap-1.5">
            <span className="opacity-80 text-[10px]">Agoda</span>
            <span>비교 →</span>
          </span>
          <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
        </a>
      </div>

      <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
        Pothos는 호텔 판매업체가 아닌 정보 제공 플랫폼입니다. 결제·예약은 위
        제휴 사이트에서 진행되며, Pothos는 commission을 수령할 수 있습니다.
      </p>
    </div>
  );
}
