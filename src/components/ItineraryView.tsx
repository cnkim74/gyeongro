"use client";

import { useState } from "react";
import {
  MapPin,
  Clock,
  Utensils,
  Home,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Map as MapIcon,
  Navigation,
} from "lucide-react";
import {
  getPlaceSearchUrl,
  getDirectionsUrl,
  getDirectionsEmbedUrl,
} from "@/lib/maps";
import TravelAdvisory from "@/components/TravelAdvisory";

export interface ScheduleItem {
  time: string;
  place: string;
  activity: string;
  duration: string;
  cost: number;
  tip: string;
}

export interface DayPlan {
  day: number;
  title: string;
  theme: string;
  schedule: ScheduleItem[];
  meal: { breakfast: string; lunch: string; dinner: string };
  accommodation: string;
  dayBudget: number;
}

export interface Itinerary {
  title: string;
  summary: string;
  highlights: string[];
  totalBudget: {
    accommodation: number;
    food: number;
    transport: number;
    activities: number;
  };
  days: DayPlan[];
  tips: string[];
  bestSeason: string;
}

function formatCurrency(n: number) {
  return n?.toLocaleString("ko-KR") ?? "0";
}

export default function ItineraryView({
  itinerary,
  destination,
}: {
  itinerary: Itinerary;
  destination: string;
}) {
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <>
      {/* Header card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white mb-6">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-blue-200" />
          <span className="text-blue-200 text-sm">{destination}</span>
        </div>
        <h1 className="text-3xl font-bold mb-3">{itinerary.title}</h1>
        <p className="text-blue-100 text-sm leading-relaxed mb-5">{itinerary.summary}</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {itinerary.highlights?.map((h, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5 text-xs"
            >
              <CheckCircle className="w-3.5 h-3.5 text-green-300" />
              {h}
            </div>
          ))}
        </div>

        {itinerary.totalBudget && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "숙박", value: itinerary.totalBudget.accommodation, icon: "🏨" },
              { label: "식비", value: itinerary.totalBudget.food, icon: "🍽️" },
              { label: "교통", value: itinerary.totalBudget.transport, icon: "🚌" },
              { label: "액티비티", value: itinerary.totalBudget.activities, icon: "🎯" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm"
              >
                <div className="text-xl mb-1">{item.icon}</div>
                <div className="text-xs text-blue-200 mb-1">{item.label}</div>
                <div className="text-sm font-bold">{formatCurrency(item.value)}원</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 mb-6">
        {itinerary.days?.map((day, idx) => (
          <div
            key={day.day}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
          >
            <button
              onClick={() => setExpandedDay(expandedDay === idx ? null : idx)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                  D{day.day}
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">{day.title}</p>
                  <p className="text-sm text-gray-400">{day.theme}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-blue-600 hidden sm:block">
                  {formatCurrency(day.dayBudget)}원
                </span>
                {expandedDay === idx ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {expandedDay === idx && (
              <div className="border-t border-gray-100 p-5 space-y-6">
                {/* 일자별 동선 - 임베드 지도 (B) + 전체 경로 보기 버튼 (A) */}
                {(() => {
                  const places = (day.schedule ?? [])
                    .map((s) => s.place)
                    .filter(Boolean);
                  if (places.length < 2) return null;

                  const dirsUrl = getDirectionsUrl(places, destination, "driving");
                  const embedUrl = getDirectionsEmbedUrl(
                    places,
                    destination,
                    googleMapsApiKey,
                    "driving"
                  );

                  return (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-blue-500" />
                          오늘의 동선 ({places.length}곳)
                        </h4>
                        {dirsUrl && (
                          <a
                            href={dirsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                          >
                            구글맵에서 열기 →
                          </a>
                        )}
                      </div>
                      {embedUrl ? (
                        <div className="rounded-2xl overflow-hidden border border-gray-100 mb-2">
                          <iframe
                            src={embedUrl}
                            width="100%"
                            height="280"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            title={`Day ${day.day} 경로`}
                          />
                        </div>
                      ) : (
                        <div className="bg-blue-50 rounded-2xl p-4 text-xs text-blue-700">
                          💡 임베드 지도를 보려면 관리자가 <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> 환경변수를 설정해야 합니다. 아래 일정의 [지도] 링크는 즉시 작동합니다.
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    시간별 일정
                  </h4>
                  <div className="space-y-3">
                    {day.schedule?.map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="text-sm font-mono text-blue-500 font-semibold w-14 shrink-0 pt-0.5">
                          {item.time}
                        </div>
                        <div className="flex-1 pb-3 border-b border-gray-50 last:border-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-gray-900 text-sm">{item.place}</p>
                            <a
                              href={getPlaceSearchUrl(item.place, destination)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 inline-flex items-center gap-0.5 text-[11px] text-blue-500 hover:text-blue-700 font-medium px-2 py-0.5 rounded-full bg-blue-50 hover:bg-blue-100"
                              title="구글맵에서 보기"
                            >
                              <MapIcon className="w-3 h-3" />
                              지도
                            </a>
                          </div>
                          <p className="text-gray-500 text-sm mt-0.5">{item.activity}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {item.duration}
                            </span>
                            {item.cost > 0 && (
                              <span className="text-xs text-emerald-600 font-medium">
                                {formatCurrency(item.cost)}원
                              </span>
                            )}
                          </div>
                          {item.tip && (
                            <div className="mt-2 px-3 py-2 bg-amber-50 rounded-lg text-xs text-amber-700">
                              💡 {item.tip}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {day.meal && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-orange-500" />
                      식사 추천
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "아침", value: day.meal.breakfast, emoji: "🌅" },
                        { label: "점심", value: day.meal.lunch, emoji: "☀️" },
                        { label: "저녁", value: day.meal.dinner, emoji: "🌙" },
                      ].map((m) => (
                        <div key={m.label} className="bg-orange-50 rounded-xl p-3">
                          <p className="text-xs text-orange-400 font-medium mb-1">
                            {m.emoji} {m.label}
                          </p>
                          <p className="text-xs text-gray-700 font-medium">{m.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {day.accommodation && (
                  <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4">
                    <Home className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-blue-600 mb-0.5">숙소 추천</p>
                      <p className="text-sm text-gray-700">{day.accommodation}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <TravelAdvisory itinerary={itinerary} destination={destination} />

      {itinerary.tips?.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 mb-6 border border-amber-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">💡</span>
            여행 꿀팁
          </h3>
          <ul className="space-y-2">
            {itinerary.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                {tip}
              </li>
            ))}
          </ul>
          {itinerary.bestSeason && (
            <p className="text-sm text-amber-700 mt-4 pt-4 border-t border-amber-200">
              🗓️ <span className="font-semibold">최적 여행 시기:</span> {itinerary.bestSeason}
            </p>
          )}
        </div>
      )}
    </>
  );
}
