"use client";

// 여행 준비 도구 — 나라별 여행경보(외교부 공공데이터) · 여행지 날씨(Open-Meteo)

import { useState } from "react";
import { ShieldAlert, CloudSun, Search, Loader2, ExternalLink } from "lucide-react";

interface Alarm {
  country: string;
  continent: string;
  level: number;
  regionType: string;
  writtenAt: string;
  mapUrl: string | null;
}

/** 경보 범위 표시 — '일부 지역'을 분명히 (나라 전체 경보로 오해하지 않도록) */
function regionLabel(t: string): string {
  if (/일부|부분/.test(t)) return "일부 지역";
  if (/전체|전역|전 지역/.test(t)) return "전 지역";
  return t;
}

const LEVEL: Record<number, { label: string; cls: string; desc: string }> = {
  0: { label: "경보 없음", cls: "bg-emerald-500", desc: "현재 발령된 여행경보가 없어요." },
  1: { label: "1단계 여행유의", cls: "bg-blue-600", desc: "신변 안전에 유의하세요." },
  2: { label: "2단계 여행자제", cls: "bg-amber-500", desc: "불필요한 여행은 자제하세요." },
  3: { label: "3단계 출국권고", cls: "bg-red-600", desc: "긴급한 용무가 아니면 출국하세요." },
  4: { label: "4단계 여행금지", cls: "bg-gray-900", desc: "여행이 금지된 지역이에요." },
};

interface Weather {
  current: { temperature: number; condition: string; emoji: string; humidity: number };
  daily: { date: string; max: number; min: number; precipitation: number; emoji: string }[];
}

export default function GuideTools() {
  // 여행경보
  const [country, setCountry] = useState("");
  const [alarmLoading, setAlarmLoading] = useState(false);
  const [alarms, setAlarms] = useState<Alarm[] | null | undefined>(undefined);

  const checkAlarm = async () => {
    if (!country.trim()) return;
    setAlarmLoading(true);
    try {
      const r = await fetch(`/api/travel-alarm?country=${encodeURIComponent(country.trim())}`);
      const j = await r.json();
      setAlarms(j.alarms ?? null);
    } catch {
      setAlarms(null);
    } finally {
      setAlarmLoading(false);
    }
  };

  // 날씨
  const [city, setCity] = useState("");
  const [wLoading, setWLoading] = useState(false);
  const [weather, setWeather] = useState<{ name: string; data: Weather } | null>(null);
  const [wError, setWError] = useState<string | null>(null);

  const checkWeather = async () => {
    if (!city.trim()) return;
    setWLoading(true);
    setWError(null);
    try {
      const g = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&language=ko`
      ).then((r) => r.json());
      const p = g.results?.[0];
      if (!p) throw new Error("도시를 찾지 못했어요. 다른 이름(영문 등)으로 검색해 보세요.");
      const w = (await fetch(`/api/weather?lat=${p.latitude}&lon=${p.longitude}`).then((r) => r.json())) as Weather;
      if (!w?.current) throw new Error("날씨를 불러오지 못했어요.");
      setWeather({ name: [p.name, p.country].filter(Boolean).join(", "), data: w });
    } catch (e) {
      setWeather(null);
      setWError(e instanceof Error ? e.message : "날씨를 불러오지 못했어요.");
    } finally {
      setWLoading(false);
    }
  };

  const input =
    "w-full flex-1 min-w-0 px-4 py-3.5 rounded-2xl border border-gray-200 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-base text-gray-900";
  const btn =
    "shrink-0 inline-flex items-center justify-center gap-1.5 px-5 rounded-2xl text-white text-base font-bold disabled:opacity-50";

  return (
    <div className="grid md:grid-cols-2 gap-5">
      {/* 여행경보 */}
      <section className="min-w-0 rounded-3xl p-5 sm:p-6 border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-orange-50 shadow-[0_10px_30px_-16px_rgba(225,29,72,0.35)]">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
          <ShieldAlert className="w-6 h-6 text-rose-500" /> 나라별 여행경보
        </h2>
        <p className="text-[15px] text-gray-500 mb-4">외교부 공식 여행경보 단계를 확인하세요</p>
        <div className="flex gap-2">
          <input
            className={input}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && checkAlarm()}
            placeholder="예: 일본, 태국, 프랑스"
          />
          <button onClick={checkAlarm} disabled={alarmLoading} className={`${btn} bg-rose-500`}>
            {alarmLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            확인
          </button>
        </div>

        {alarms !== undefined && (
          <div className="mt-4">
            {alarms === null ? (
              <p className="text-[15px] text-gray-600">
                지금은 여행경보를 불러올 수 없어요.{" "}
                <a href="https://www.0404.go.kr" target="_blank" rel="noopener noreferrer" className="font-bold text-rose-600 underline">
                  외교부 해외안전여행
                </a>
                에서 확인해 주세요.
              </p>
            ) : alarms.length === 0 ? (
              <p className="text-[15px] text-gray-700">
                <b>{country}</b>에 발령된 여행경보가 없어요. 나라 이름을 정확히 입력했는지도 확인해 주세요.
              </p>
            ) : (
              <ul className="space-y-2">
                {[...alarms].sort((x, y) => y.level - x.level).map((a, i) => {
                  const lv = LEVEL[a.level] ?? LEVEL[0];
                  return (
                    <li key={i} className="flex items-start gap-3 bg-white rounded-2xl p-4 border border-gray-100">
                      <span className={`shrink-0 px-3 py-1.5 rounded-full text-white text-sm font-bold ${lv.cls}`}>{lv.label}</span>
                      <span className="text-[15px] text-gray-800">
                        <b>{a.country}</b>
                        {a.regionType && (
                          <span
                            className={`ml-1.5 inline-block px-2 py-0.5 rounded-full text-xs font-bold align-middle ${
                              regionLabel(a.regionType) === "일부 지역" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {regionLabel(a.regionType)}
                          </span>
                        )}
                        <br />
                        <span className="text-gray-500 text-sm">
                          {lv.desc}
                          {a.writtenAt ? ` (${a.writtenAt} 기준)` : ""}
                        </span>
                        {a.mapUrl && (
                          <a
                            href={a.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mt-1 text-sm font-semibold text-rose-600"
                          >
                            경보 지역 지도 보기 →
                          </a>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {alarms && alarms.some((a) => regionLabel(a.regionType) === "일부 지역") && (
              <p className="mt-3 text-sm text-gray-600 bg-amber-50 rounded-xl px-3 py-2">
                💡 &apos;일부 지역&apos; 경보는 나라 전체가 아니라 지정된 지역에만 적용돼요. 지도에서 해당 지역을 확인하세요.
              </p>
            )}
            <a
              href="https://www.0404.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-rose-600"
            >
              외교부 해외안전여행에서 자세히 보기 <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </section>

      {/* 날씨 */}
      <section className="min-w-0 rounded-3xl p-5 sm:p-6 border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50 shadow-[0_10px_30px_-16px_rgba(14,165,233,0.4)]">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
          <CloudSun className="w-6 h-6 text-sky-500" /> 여행지 날씨
        </h2>
        <p className="text-[15px] text-gray-500 mb-4">도시 이름으로 5일 날씨를 확인하세요</p>
        <div className="flex gap-2">
          <input
            className={input}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && checkWeather()}
            placeholder="예: 도쿄, 파리, 제주"
          />
          <button onClick={checkWeather} disabled={wLoading} className={`${btn} bg-sky-500`}>
            {wLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            확인
          </button>
        </div>
        {wError && <p className="mt-4 text-[15px] text-rose-600">{wError}</p>}
        {weather && (
          <div className="mt-4">
            <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 mb-3">
              <span className="text-4xl">{weather.data.current.emoji}</span>
              <div>
                <p className="text-sm text-gray-500">{weather.name} · 지금</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {Math.round(weather.data.current.temperature)}° <span className="text-base font-semibold text-gray-600">{weather.data.current.condition}</span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {weather.data.daily.slice(0, 5).map((d) => (
                <div key={d.date} className="bg-white rounded-xl p-2 text-center border border-gray-100">
                  <p className="text-xs text-gray-500">{d.date.slice(5).replace("-", "/")}</p>
                  <p className="text-xl">{d.emoji}</p>
                  <p className="text-sm font-bold text-gray-900">{Math.round(d.max)}°</p>
                  <p className="text-xs text-gray-400">{Math.round(d.min)}°</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
