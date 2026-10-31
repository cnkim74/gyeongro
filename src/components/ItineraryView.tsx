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
  HeartPulse,
  Stethoscope,
  Sparkles,
  Coffee,
  Hash,
  Wallet,
  Loader2,
} from "lucide-react";
import { getPlaceSearchUrl, getDirectionsUrl } from "@/lib/maps";
import TripMap, { useResolvedDays, googlePlaceUrl, legDirectionsUrl, dayColor } from "@/components/TripMap";
import PlaceInfo from "@/components/PlaceInfo";
import {
  googleMapsSearch,
  naverMapSearch,
  instagramHashtag,
  isKoreanCity,
} from "@/lib/search-links";
import TravelAdvisory from "@/components/TravelAdvisory";

export interface TransportLeg {
  mode?: string;
  duration?: string;
  cost_kr?: string | null;
}

export interface NearbyAlternative {
  name: string;
  reason?: string;
}

export interface NearbyFood {
  name: string;
  type?: string;
  why?: string;
}

/** 장소 좌표 (Google place ID + 위경도). 좌표는 Google 약관상 30일까지만 유효 */
export interface PlaceGeo {
  placeId: string;
  lat: number;
  lng: number;
  at: string;
}

export interface ScheduleItem {
  time: string;
  place: string;
  activity: string;
  duration: string;
  cost: number;
  tip: string;
  transport_to_next?: TransportLeg | null;
  nearby_alternatives?: NearbyAlternative[];
  nearby_food?: NearbyFood[];
  geo?: PlaceGeo | null;
}

export interface DayPlan {
  day: number;
  /** 그날 머무는 도시 (다중 도시 일정) */
  city?: string;
  title: string;
  theme: string;
  schedule: ScheduleItem[];
  meal: { breakfast: string; lunch: string; dinner: string };
  accommodation: string;
  dayBudget: number;
  /** 뼈대 단계의 하루 요약 (상세 일정 도착 전 표시) */
  plan?: string;
  /** 상세 일정 작성 중 (뼈대만 도착한 상태) */
  pending?: boolean;
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

function detectMedicalDayType(day: DayPlan): "treatment" | "recovery" | null {
  const text = `${day.title ?? ""} ${day.theme ?? ""}`;
  if (/시술일|시술 ?받|수술일|검진일|검진 ?받/.test(text)) return "treatment";
  if (/회복|recovery/i.test(text)) return "recovery";
  return null;
}

/** #rrggbb → rgba(…, alpha) */
function tint(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** 같은 색을 조금 어둡게 (그라데이션 끝 색) */
function shade(hex: string, amount = 0.25): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  const f = (v: number) => Math.max(0, Math.round(v * (1 - amount)));
  return `rgb(${f((n >> 16) & 255)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}

export default function ItineraryView({
  itinerary,
  destination,
  generating = false,
}: {
  itinerary: Itinerary;
  destination: string;
  /** AI가 아직 Day 상세를 채우는 중 */
  generating?: boolean;
}) {
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  // 좌표 없는(예전 저장) 일정은 여기서 한 번만 채움 → 지도·장소 정보가 공유
  const days = useResolvedDays(itinerary.days ?? [], destination);

  const budget = itinerary.totalBudget;
  const totalBudget = budget
    ? (budget.accommodation ?? 0) + (budget.food ?? 0) + (budget.transport ?? 0) + (budget.activities ?? 0)
    : 0;

  return (
    <>
      {/* ── 상단 요약 카드 ───────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white mb-6">
        <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 mb-4">
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-semibold">{destination}</span>
        </div>
        <h1 className="text-[26px] sm:text-3xl font-extrabold leading-snug mb-3">{itinerary.title}</h1>
        <p className="text-base text-blue-50 leading-relaxed mb-5">{itinerary.summary}</p>

        {itinerary.highlights?.length > 0 && (
          <ul className="space-y-2 mb-6">
            {itinerary.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-[15px] leading-snug">
                <CheckCircle className="w-5 h-5 text-green-300 shrink-0 mt-0.5" />
                {h}
              </li>
            ))}
          </ul>
        )}

        {totalBudget > 0 && (
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 text-[15px] text-blue-100">
                <Wallet className="w-4 h-4" /> 예상 총 경비
              </span>
              <span className="text-xl font-extrabold">{formatCurrency(totalBudget)}원</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "숙박", value: budget.accommodation, icon: "🏨" },
                { label: "식비", value: budget.food, icon: "🍽️" },
                { label: "교통", value: budget.transport, icon: "🚌" },
                { label: "즐길거리", value: budget.activities, icon: "🎯" },
              ].map((item) => (
                <div key={item.label} className="bg-white/10 rounded-xl px-3 py-2">
                  <div className="text-sm text-blue-100">
                    {item.icon} {item.label}
                  </div>
                  <div className="text-[15px] font-bold">{formatCurrency(item.value)}원</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 전체 여행 지도 ─────────────────────────── */}
      {days.length > 0 && (
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MapIcon className="w-6 h-6 text-blue-500" />
            여행 지도
          </h2>
          <TripMap days={days} height={360} />
        </section>
      )}

      {/* ── Day 별 일정 ────────────────────────────── */}
      <div className="space-y-4 mb-6">
        {days.map((day, idx) => (
          <DayCard
            key={idx}
            day={day}
            idx={idx}
            days={days}
            destination={destination}
            expanded={expandedDay === idx}
            onToggle={() => setExpandedDay(expandedDay === idx ? null : idx)}
            generating={generating}
          />
        ))}
      </div>

      {!generating && <TravelAdvisory itinerary={itinerary} destination={destination} />}

      {itinerary.tips?.length > 0 && (
        <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 mb-6 border border-amber-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">💡 여행 꿀팁</h2>
          <ul className="space-y-3">
            {itinerary.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-[15px] text-gray-800 leading-relaxed">
                <CheckCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                {tip}
              </li>
            ))}
          </ul>
          {itinerary.bestSeason && (
            <p className="text-[15px] text-amber-800 mt-4 pt-4 border-t border-amber-200">
              🗓️ <span className="font-bold">추천 여행 시기</span> · {itinerary.bestSeason}
            </p>
          )}
        </section>
      )}

      {/* AI 생성 일정 — 외부 검증 안내 */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 text-sm text-slate-600 leading-relaxed">
        <p className="font-bold text-slate-800 mb-1">ℹ️ AI가 만든 일정이에요</p>
        영업시간·가격·휴무일은 바뀔 수 있어요. 출발 전에 각 장소의{" "}
        <span className="font-semibold text-slate-800">[지도]</span>·
        <span className="font-semibold text-slate-800">[평점·사진·후기]</span> 버튼으로 꼭 확인해주세요.
      </div>
    </>
  );
}

// ── 하루 카드 ─────────────────────────────────────────────
function DayCard({
  day,
  idx,
  days,
  destination,
  expanded,
  onToggle,
  generating,
}: {
  day: DayPlan;
  idx: number;
  days: DayPlan[];
  destination: string;
  expanded: boolean;
  onToggle: () => void;
  generating: boolean;
}) {
  const medType = detectMedicalDayType(day);
  const color = medType ? "#e11d48" : dayColor(idx);
  const pending = !!day.pending;
  const places = (day.schedule ?? []).map((s) => s.place).filter(Boolean);
  const dirsUrl = places.length >= 2 ? getDirectionsUrl(places, day.city || destination, "transit") : null;

  return (
    <div
      className="rounded-3xl overflow-hidden border"
      style={{
        // 날짜 색을 살린 은은한 그라데이션 카드
        background: `linear-gradient(135deg, ${tint(color, 0.12)} 0%, #ffffff 42%, #ffffff 70%, ${tint(color, 0.06)} 100%)`,
        borderColor: tint(color, 0.22),
        boxShadow: `0 10px 30px -14px ${tint(color, 0.45)}`,
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-white/40 transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div
            className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white shrink-0"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, ${shade(color, 0.3)} 100%)`,
              boxShadow: `0 6px 14px -6px ${tint(color, 0.7)}`,
            }}
          >
            <span className="text-[11px] font-semibold opacity-90 leading-none">DAY</span>
            <span className="text-xl font-extrabold leading-tight">{day.day}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-lg font-bold text-gray-900 leading-snug">{day.title}</p>
              {medType === "treatment" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                  <HeartPulse className="w-3 h-3" /> 시술일
                </span>
              )}
              {medType === "recovery" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-xs font-bold">
                  <Stethoscope className="w-3 h-3" /> 회복일
                </span>
              )}
            </div>
            <p className="text-[15px] text-gray-500 mt-0.5">
              {day.city ? `${day.city} · ` : ""}
              {day.theme}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {pending ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          ) : (
            day.dayBudget > 0 && (
              <span className="text-[15px] font-bold text-blue-600 hidden sm:block">
                {formatCurrency(day.dayBudget)}원
              </span>
            )
          )}
          {expanded ? (
            <ChevronUp className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && pending && (
        <div className="border-t p-5" style={{ borderColor: tint(color, 0.15) }}>
          {day.plan && <p className="text-[15px] text-gray-700 leading-relaxed mb-4">🗺️ {day.plan}</p>}
          <p className="text-[15px] font-semibold text-blue-600 mb-3 inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {generating ? "상세 일정을 작성하고 있어요…" : "상세 일정을 불러오지 못했어요."}
          </p>
          {generating && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="pothos-shimmer h-16 rounded-2xl" />
              ))}
            </div>
          )}
        </div>
      )}

      {expanded && !pending && (
        <div className="border-t p-5 space-y-6" style={{ borderColor: tint(color, 0.15) }}>
          {/* 오늘의 지도 */}
          {places.length >= 2 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-blue-500" />
                  오늘의 동선 · {places.length}곳
                </h3>
                {dirsUrl && (
                  <a
                    href={dirsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    구글맵으로 보기 →
                  </a>
                )}
              </div>
              <TripMap days={days} initialDayIndex={idx} showTabs={false} height={260} />
            </div>
          )}

          {/* 시간별 일정 */}
          <div>
            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              시간별 일정
            </h3>
            <ol className="space-y-2">
              {day.schedule?.map((item, i) => (
                <ScheduleRow
                  key={i}
                  item={item}
                  order={i + 1}
                  color={color}
                  next={day.schedule?.[i + 1]}
                  city={day.city || destination}
                  destination={destination}
                />
              ))}
            </ol>
          </div>

          {/* 식사 */}
          {day.meal && (
            <div>
              <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-500" />
                식사 추천
              </h3>
              <div className="bg-orange-50 rounded-2xl divide-y divide-orange-100">
                {[
                  { label: "아침", value: day.meal.breakfast, emoji: "🌅" },
                  { label: "점심", value: day.meal.lunch, emoji: "☀️" },
                  { label: "저녁", value: day.meal.dinner, emoji: "🌙" },
                ]
                  .filter((m) => m.value)
                  .map((m) => (
                    <div key={m.label} className="flex gap-3 px-4 py-3 text-[15px]">
                      <span className="shrink-0 font-semibold text-orange-600 w-14">
                        {m.emoji} {m.label}
                      </span>
                      <span className="text-gray-800">{m.value}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 숙소 */}
          {day.accommodation && (
            <div className="flex items-start gap-3 bg-blue-50 rounded-2xl p-4">
              <Home className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-blue-700 mb-0.5">숙소 추천</p>
                <p className="text-[15px] text-gray-800">{day.accommodation}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 일정 한 줄 (장소) ─────────────────────────────────────
function ScheduleRow({
  item,
  order,
  color,
  next,
  city,
  destination,
}: {
  item: ScheduleItem;
  order: number;
  color: string;
  next?: ScheduleItem;
  city: string;
  destination: string;
}) {
  const [more, setMore] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const inKorea = isKoreanCity(destination);
  const hasMore =
    (item.nearby_alternatives?.length ?? 0) > 0 || (item.nearby_food?.length ?? 0) > 0;
  const legUrl = next
    ? legDirectionsUrl({ name: item.place, geo: item.geo }, { name: next.place, geo: next.geo })
    : null;

  return (
    <li>
      <div
        className="relative rounded-2xl p-4 overflow-hidden"
        style={{
          background: `linear-gradient(160deg, #ffffff 55%, ${tint(color, 0.08)} 100%)`,
          border: `1px solid ${tint(color, 0.18)}`,
          boxShadow: `0 4px 16px -10px ${tint(color, 0.5)}`,
        }}
      >
        {/* 왼쪽 그라데이션 포인트 라인 */}
        <span
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ background: `linear-gradient(180deg, ${color}, ${tint(color, 0.15)})` }}
        />
        <div className="flex items-start gap-3">
          <span
            className="shrink-0 w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center mt-0.5"
            style={{
              background: `linear-gradient(135deg, ${color}, ${shade(color, 0.3)})`,
              boxShadow: `0 4px 10px -4px ${tint(color, 0.7)}`,
            }}
          >
            {order}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color }}>
                  {item.time}
                </p>
                <p className="text-[17px] font-bold text-gray-900 leading-snug">{item.place}</p>
              </div>
              <a
                href={item.geo ? googlePlaceUrl(item.place, item.geo) : getPlaceSearchUrl(item.place, destination)}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100"
              >
                <MapIcon className="w-4 h-4" />
                지도
              </a>
            </div>

            <p className="text-[15px] text-gray-700 leading-relaxed mt-1">{item.activity}</p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-gray-500">
              {item.duration && <span>⏱ {item.duration}</span>}
              {item.cost > 0 && <span className="font-semibold text-emerald-600">💰 {formatCurrency(item.cost)}원</span>}
            </div>

            {item.tip && (
              // 팁은 한 줄로 — 누르면 전체 보기
              <button
                onClick={() => setTipOpen(!tipOpen)}
                className="mt-2 w-full min-w-0 flex items-start gap-1.5 px-3 py-2 rounded-xl text-left text-sm text-amber-900"
                style={{ background: "linear-gradient(90deg, #fef3c7, #fffbeb)" }}
              >
                <span className="shrink-0">💡</span>
                <span className={`min-w-0 flex-1 ${tipOpen ? "leading-relaxed" : "truncate"}`}>{item.tip}</span>
              </button>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <PlaceInfo name={item.place} geo={item.geo} city={city} />
              {hasMore && (
                <button
                  onClick={() => setMore(!more)}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-slate-600 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200"
                >
                  {more ? "접기" : "근처 대안·맛집"}
                  {more ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
            </div>

            {more && (
              <div className="mt-3 space-y-3">
                {item.nearby_alternatives && item.nearby_alternatives.length > 0 && (
                  <div className="px-4 py-3 bg-slate-50 rounded-xl">
                    <p className="text-sm font-bold text-slate-600 mb-2 flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-slate-400" />
                      대신 가도 좋은 곳
                    </p>
                    <ul className="space-y-1.5">
                      {item.nearby_alternatives.map((alt, j) => (
                        <li key={j}>
                          <a
                            href={inKorea ? naverMapSearch(alt.name) : googleMapsSearch(alt.name, destination)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[15px] text-slate-800 hover:text-blue-600"
                          >
                            <span className="font-semibold">{alt.name}</span>
                            {alt.reason && <span className="text-slate-500"> — {alt.reason}</span>}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.nearby_food && item.nearby_food.length > 0 && (
                  <div className="px-4 py-3 bg-rose-50/70 rounded-xl">
                    <p className="text-sm font-bold text-rose-700 mb-2 flex items-center gap-1">
                      <Coffee className="w-4 h-4" />
                      근처 인기 카페·식당
                    </p>
                    <ul className="space-y-2">
                      {item.nearby_food.map((food, j) => (
                        <li key={j} className="text-[15px]">
                          <p className="text-slate-800 leading-snug">
                            <span className="font-semibold">{food.name}</span>
                            {food.type && <span className="text-rose-600"> · {food.type}</span>}
                            {food.why && <span className="text-slate-500"> — {food.why}</span>}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-sm">
                            <a
                              href={inKorea ? naverMapSearch(food.name) : googleMapsSearch(food.name, destination)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            >
                              <MapIcon className="w-3.5 h-3.5" />
                              {inKorea ? "네이버 지도" : "구글 지도"}
                            </a>
                            <a
                              href={instagramHashtag(food.name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-pink-600 hover:text-pink-800"
                            >
                              <Hash className="w-3.5 h-3.5" />
                              인스타그램
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 다음 장소까지 이동 */}
      {next && (item.transport_to_next?.mode || legUrl) && (
        <div className="flex items-center gap-2 pl-6 py-2 text-sm text-slate-600">
          <span className="text-slate-300">│</span>
          {item.transport_to_next?.mode && (
            <span className="font-semibold text-slate-700">{item.transport_to_next.mode}</span>
          )}
          {item.transport_to_next?.duration && <span>· {item.transport_to_next.duration}</span>}
          {item.transport_to_next?.cost_kr && <span>· {item.transport_to_next.cost_kr}</span>}
          {legUrl && (
            <a
              href={legUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto font-semibold text-blue-600 hover:text-blue-800 shrink-0"
            >
              길찾기 →
            </a>
          )}
        </div>
      )}
    </li>
  );
}
