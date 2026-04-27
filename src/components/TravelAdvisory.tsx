"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Phone,
  CreditCard,
  Plane,
  Clock,
  Info,
  Calendar as CalendarIcon,
  Download,
  Cloud,
  Loader2,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  resolveCountry,
  ADVISORY_LEVEL_META,
  type CountryAdvisory,
} from "@/lib/advisory";
import {
  buildICS,
  downloadICS,
  getGoogleCalendarUrl,
  type CalendarEvent,
} from "@/lib/calendar";
import type { Itinerary } from "@/components/ItineraryView";

interface WeatherData {
  current: {
    temperature: number;
    apparent: number;
    humidity: number;
    wind: number;
    condition: string;
    emoji: string;
  };
  daily: Array<{
    date: string;
    max: number;
    min: number;
    precipitation: number;
    condition: string;
    emoji: string;
  }>;
  timezone: string;
}

function todayPlusDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function buildEvents(
  itinerary: Itinerary,
  destination: string,
  startISO: string
): CalendarEvent[] {
  const start = new Date(`${startISO}T00:00:00`);
  return itinerary.days.map((day, i) => {
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + i);
    const description = [
      day.theme ? `테마: ${day.theme}` : "",
      day.schedule
        ?.map((s) => `${s.time} ${s.place} — ${s.activity}`)
        .join("\n"),
      day.meal
        ? `🍽️ 아침: ${day.meal.breakfast} · 점심: ${day.meal.lunch} · 저녁: ${day.meal.dinner}`
        : "",
      day.accommodation ? `🏨 숙소: ${day.accommodation}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    return {
      title: `[${destination}] Day ${day.day} — ${day.title}`,
      description,
      location: destination,
      startDate: dayDate,
      endDate: dayDate,
      allDay: true,
    };
  });
}

export default function TravelAdvisory({
  itinerary,
  destination,
}: {
  itinerary: Itinerary;
  destination: string;
}) {
  const country = useMemo<CountryAdvisory | null>(
    () => resolveCountry(destination),
    [destination]
  );

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>(todayPlusDays(7));
  const [showAllNotes, setShowAllNotes] = useState(false);

  const events = useMemo(
    () => buildEvents(itinerary, destination, startDate),
    [itinerary, destination, startDate]
  );

  useEffect(() => {
    if (!country) return;
    let cancelled = false;
    (async () => {
      setWeatherLoading(true);
      try {
        const res = await fetch(
          `/api/weather?lat=${country.capital.lat}&lon=${country.capital.lon}`
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) setWeather(data);
      } catch {
        if (!cancelled) setWeather(null);
      } finally {
        if (!cancelled) setWeatherLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [country]);

  if (!country) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-slate-900 mb-1">
              주의사항 데이터 준비 중
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              <span className="font-semibold">{destination}</span>에 대한 국가별
              주의사항이 아직 등록되지 않았습니다. 출발 전 외교부{" "}
              <a
                href="https://www.0404.go.kr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                해외안전여행
              </a>{" "}
              사이트를 확인해 주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const meta = ADVISORY_LEVEL_META[country.level];
  const tripDays = itinerary.days?.length ?? 1;

  const handleDownloadICS = () => {
    const ics = buildICS(events, `${destination} 여행`);
    downloadICS(`pothos-${destination}-${startDate}`, ics);
  };

  const handleGoogleCalendar = () => {
    if (events.length === 0) return;
    const first = events[0];
    const last = events[events.length - 1];

    // Google Calendar URL은 길이 제한이 있어 description을 짧게 유지.
    // 자세한 일정은 .ics 다운로드에 들어 있음.
    const dayList = events
      .map((e, i) => `Day ${i + 1}: ${itinerary.days[i]?.title ?? ""}`)
      .join("\n");
    let description = `${itinerary.summary}\n\n${dayList}`;
    if (description.length > 1000) {
      description = description.slice(0, 1000) + "...";
    }

    const merged: CalendarEvent = {
      title: `[${destination}] ${itinerary.title}`,
      description,
      location: destination,
      startDate: first.startDate,
      endDate: last.endDate,
      allDay: true,
    };
    window.open(getGoogleCalendarUrl(merged), "_blank", "noopener,noreferrer");
  };

  const visibleNotes = showAllNotes ? country.notes : country.notes.slice(0, 3);

  return (
    <div className="space-y-6 mb-6">
      {/* Country advisory banner */}
      <div
        className={`rounded-2xl border ${meta.border} ${meta.bg} p-6 ring-4 ${meta.ring}`}
      >
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <Shield className={`w-6 h-6 ${meta.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs font-bold tracking-wide uppercase ${meta.color}`}>
                {meta.label}
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-600">{country.levelLabel}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {country.country} 여행 주의사항
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed mb-4">
              {country.summary}
            </p>

            <ul className="space-y-2 mb-3">
              {visibleNotes.map((note, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-slate-700"
                >
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${meta.color}`}
                  />
                  <span>{note}</span>
                </li>
              ))}
            </ul>

            {country.notes.length > 3 && (
              <button
                onClick={() => setShowAllNotes(!showAllNotes)}
                className={`text-xs font-semibold ${meta.color} hover:underline inline-flex items-center gap-1`}
              >
                {showAllNotes ? (
                  <>
                    접기 <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    {country.notes.length - 3}개 더보기{" "}
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Quick facts grid */}
        <div className="mt-5 pt-5 border-t border-white/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {country.visa && (
            <div className="flex items-start gap-2">
              <Plane className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-500 mb-0.5">비자</p>
                <p className="font-semibold text-slate-800">{country.visa}</p>
              </div>
            </div>
          )}
          {country.currency && (
            <div className="flex items-start gap-2">
              <CreditCard className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-500 mb-0.5">통화</p>
                <p className="font-semibold text-slate-800">{country.currency}</p>
              </div>
            </div>
          )}
          {country.timezone && (
            <div className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-500 mb-0.5">시간대</p>
                <p className="font-semibold text-slate-800">{country.timezone}</p>
              </div>
            </div>
          )}
          {country.emergency.police && (
            <div className="flex items-start gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-500 mb-0.5">긴급</p>
                <p className="font-semibold text-slate-800">
                  경찰 {country.emergency.police}
                  {country.emergency.ambulance &&
                    ` · 구급 ${country.emergency.ambulance}`}
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-[11px] text-slate-500">
          출처: 외교부 해외안전여행(0404.go.kr) ·{" "}
          <a
            href="https://www.0404.go.kr/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            최신 정보 확인
          </a>
        </p>
      </div>

      {/* Weather */}
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-sky-500" />
            현재 날씨 · {country.capital.name}
          </h3>
          {weather?.timezone && (
            <span className="text-xs text-slate-500">{weather.timezone}</span>
          )}
        </div>

        {weatherLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
          </div>
        ) : weather ? (
          <>
            <div className="flex items-center gap-5 mb-5">
              <div className="text-5xl">{weather.current.emoji}</div>
              <div>
                <div className="text-4xl font-bold text-slate-900">
                  {Math.round(weather.current.temperature)}°
                  <span className="text-base text-slate-500 font-medium ml-1">C</span>
                </div>
                <p className="text-sm text-slate-600">
                  {weather.current.condition} · 체감{" "}
                  {Math.round(weather.current.apparent)}°
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  습도 {weather.current.humidity}% · 풍속{" "}
                  {Math.round(weather.current.wind)} km/h
                </p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {weather.daily.slice(0, 5).map((d, i) => {
                const date = new Date(d.date);
                const label =
                  i === 0
                    ? "오늘"
                    : `${date.getMonth() + 1}/${date.getDate()}`;
                return (
                  <div
                    key={d.date}
                    className="bg-white/70 rounded-xl p-2.5 text-center"
                  >
                    <p className="text-[11px] text-slate-500 mb-1">{label}</p>
                    <div className="text-2xl mb-1">{d.emoji}</div>
                    <p className="text-xs font-semibold text-slate-800">
                      {Math.round(d.max)}°
                      <span className="text-slate-400 font-normal">
                        /{Math.round(d.min)}°
                      </span>
                    </p>
                    {d.precipitation > 30 && (
                      <p className="text-[10px] text-blue-500 mt-0.5">
                        💧 {d.precipitation}%
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500 py-4">
            날씨 정보를 불러오지 못했습니다.
          </p>
        )}
      </div>

      {/* Calendar export */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <CalendarIcon className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-slate-900">캘린더에 등록</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          출발일을 정하면 {tripDays}일 일정이 자동으로 캘린더에 추가됩니다.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              출발일
            </label>
            <input
              type="date"
              value={startDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-slate-900"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              종료일 (자동)
            </label>
            <div className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm">
              {(() => {
                const end = new Date(`${startDate}T00:00:00`);
                end.setDate(end.getDate() + tripDays - 1);
                return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(
                  2,
                  "0"
                )}-${String(end.getDate()).padStart(2, "0")}`;
              })()}
            </div>
          </div>
        </div>

        <button
          onClick={handleGoogleCalendar}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-base font-bold hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all"
        >
          <CalendarIcon className="w-5 h-5" />
          내 캘린더에 추가
        </button>

        <p className="mt-2.5 text-[11px] text-slate-500 text-center">
          버튼을 누르면 캘린더 이벤트 작성창이 열려요. 저장 한 번이면 끝!
        </p>

        <details className="mt-4 pt-4 border-t border-slate-100 group">
          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 inline-flex items-center gap-1 list-none">
            <Download className="w-3 h-3" />
            다른 캘린더 사용? (Apple · Outlook · 삼성)
          </summary>
          <div className="mt-3">
            <button
              onClick={handleDownloadICS}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              iCalendar (.ics) 파일 다운로드
            </button>
            <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
              파일을 열면 Apple 캘린더·Outlook·삼성 캘린더에서 자동으로 일정이
              추가됩니다.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
