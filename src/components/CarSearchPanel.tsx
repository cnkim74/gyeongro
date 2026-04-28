"use client";

import { useState } from "react";
import { Car, Calendar, Clock, ExternalLink, MapPin } from "lucide-react";
import { buildCarSearchUrls, preferEnglishCar } from "@/lib/cars";

interface Props {
  /** 픽업 도시 (일정 도착지 — 자동) */
  pickupCity: string;
  /** 픽업 날짜 (없으면 사용자 입력) */
  pickupDate?: string;
  /** 반납 날짜 (없으면 nights로 자동) */
  returnDate?: string | null;
  /** 박수 */
  nights?: number;
  /** 컴팩트 모드 */
  compact?: boolean;
}

function todayPlus(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("sv-SE");
}

function addDays(date: string, n: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("sv-SE");
}

export default function CarSearchPanel({
  pickupCity: initialPickupCity,
  pickupDate: initialPickup,
  returnDate: initialReturn,
  nights,
  compact = false,
}: Props) {
  const [pickupCity, setPickupCity] = useState(initialPickupCity);
  const [returnCityOverride, setReturnCityOverride] = useState<string>("");
  const [differentReturn, setDifferentReturn] = useState(false);

  const [pickupDate, setPickupDate] = useState<string>(
    initialPickup ?? todayPlus(30)
  );
  const computedReturn =
    initialReturn ??
    (nights ? addDays(pickupDate, nights) : addDays(pickupDate, 3));
  const [returnDate, setReturnDate] = useState<string>(computedReturn);
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnTime, setReturnTime] = useState("10:00");
  const [driverAge, setDriverAge] = useState(30);

  const handlePickupChange = (v: string) => {
    setPickupDate(v);
    if (!initialReturn) {
      setReturnDate(addDays(v, nights ?? 3));
    }
  };

  const englishPickup = preferEnglishCar(pickupCity);
  const englishReturn = differentReturn
    ? preferEnglishCar(returnCityOverride)
    : englishPickup;

  const urls = buildCarSearchUrls({
    pickupCity: englishPickup,
    returnCity: differentReturn ? englishReturn : undefined,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    driverAge,
  });

  const days = Math.max(
    0,
    Math.round(
      (new Date(returnDate).getTime() - new Date(pickupDate).getTime()) /
        86400000
    )
  );

  return (
    <div
      className={`bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-3xl ${
        compact ? "p-5" : "p-6"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center">
          <Car className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm">
            이 일정에 맞는 렌트카 찾기
          </h3>
          <p className="text-[11px] text-slate-500">
            Trip.com · Rentalcars.com · DiscoverCars 동시 비교
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-3 mb-3 border border-teal-100">
        {/* 픽업·반납 도시 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <MapPin className="w-3.5 h-3.5 text-teal-500 shrink-0" />
            <input
              type="text"
              value={pickupCity}
              onChange={(e) => setPickupCity(e.target.value)}
              placeholder="픽업 도시"
              className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-teal-400"
            />
            {englishPickup !== pickupCity && (
              <span className="text-[10px] text-slate-400 shrink-0">
                ({englishPickup})
              </span>
            )}
          </div>

          {differentReturn && (
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <input
                type="text"
                value={returnCityOverride}
                onChange={(e) => setReturnCityOverride(e.target.value)}
                placeholder="반납 도시 (다른 곳)"
                className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-rose-400"
              />
            </div>
          )}

          <label className="text-[11px] text-slate-600 inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={differentReturn}
              onChange={(e) => setDifferentReturn(e.target.checked)}
              className="rounded"
            />
            다른 도시에서 반납
          </label>
        </div>

        {/* 날짜·시간 */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              픽업
            </label>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => handlePickupChange(e.target.value)}
              min={todayPlus(0)}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-teal-400 mb-1"
            />
            <input
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-teal-400"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              반납
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              min={pickupDate}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-teal-400 mb-1"
            />
            <input
              type="time"
              value={returnTime}
              onChange={(e) => setReturnTime(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-teal-400"
            />
          </div>
        </div>

        {/* 운전자 나이 + 기간 */}
        <div className="flex items-center gap-3 mt-3 text-xs">
          <label className="text-slate-600 inline-flex items-center gap-1.5">
            운전자 만
            <input
              type="number"
              min={18}
              max={90}
              value={driverAge}
              onChange={(e) => setDriverAge(Number(e.target.value) || 30)}
              className="w-12 px-1.5 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-teal-400 text-center"
            />
            세
          </label>
          <span className="text-slate-500 inline-flex items-center gap-1 ml-auto">
            <Clock className="w-3 h-3" />
            {days}일 대여
          </span>
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
          href={urls.rentalcars}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="group flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 hover:-translate-y-0.5 transition-all shadow-sm"
        >
          <span className="flex items-center gap-1.5">
            <span className="opacity-80 text-[10px]">Rentalcars</span>
            <span>비교 →</span>
          </span>
          <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
        </a>
        <a
          href={urls.discovercars}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="group flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-cyan-600 text-white font-bold text-xs hover:bg-cyan-700 hover:-translate-y-0.5 transition-all shadow-sm"
        >
          <span className="flex items-center gap-1.5">
            <span className="opacity-80 text-[10px]">DiscoverCars</span>
            <span>비교 →</span>
          </span>
          <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
        </a>
      </div>

      <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
        💡 해외 운전 시 <strong>국제면허증</strong>(₩8,500, 운전면허시험장 즉시
        발급) + <strong>한국 면허 + 여권</strong> 3종 휴대 의무. 좌측통행 국가
        주의.
      </p>
      <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
        Pothos는 렌트카 판매업체가 아닌 정보 제공 플랫폼입니다. 결제·예약은 위
        제휴 사이트에서 진행되며, Pothos는 commission을 수령할 수 있습니다.
      </p>
    </div>
  );
}
