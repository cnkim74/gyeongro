"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Wallet,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Clock,
  Utensils,
  Home,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ScheduleItem {
  time: string;
  place: string;
  activity: string;
  duration: string;
  cost: number;
  tip: string;
}

interface DayPlan {
  day: number;
  title: string;
  theme: string;
  schedule: ScheduleItem[];
  meal: { breakfast: string; lunch: string; dinner: string };
  accommodation: string;
  dayBudget: number;
}

interface Itinerary {
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

const themes = [
  { id: "food", label: "미식", emoji: "🍜" },
  { id: "nature", label: "자연", emoji: "🌿" },
  { id: "culture", label: "역사·문화", emoji: "🏛️" },
  { id: "activity", label: "액티비티", emoji: "🏄" },
  { id: "healing", label: "힐링", emoji: "🧘" },
  { id: "shopping", label: "쇼핑", emoji: "🛍️" },
  { id: "nightlife", label: "나이트라이프", emoji: "🌃" },
  { id: "photo", label: "인스타 명소", emoji: "📸" },
];

const popularDestinations = [
  "제주도", "부산", "강릉", "경주", "여수", "전주",
  "도쿄", "오사카", "교토", "방콕", "파리", "뉴욕",
];

function formatCurrency(n: number) {
  return n?.toLocaleString("ko-KR") ?? "0";
}

function PlannerContent() {
  const searchParams = useSearchParams();
  const initialDestination = searchParams.get("destination") ?? "";

  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState(initialDestination);
  const [days, setDays] = useState(3);
  const [people, setPeople] = useState(2);
  const [budget, setBudget] = useState(500000);
  const [travelStyle, setTravelStyle] = useState("balanced");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const rawBuffer = useRef("");

  const toggleTheme = (id: string) => {
    setSelectedThemes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const generateItinerary = async () => {
    setIsLoading(true);
    setError(null);
    setItinerary(null);
    rawBuffer.current = "";

    try {
      const res = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          days,
          people,
          budget: budget * people,
          travelStyle,
          themes: selectedThemes,
        }),
      });

      if (!res.ok || !res.body) throw new Error("서버 오류가 발생했습니다.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));
          if (data.error) throw new Error(data.error);
          if (data.done) {
            const jsonText = rawBuffer.current.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const parsed = JSON.parse(jsonText);
            setItinerary(parsed);
            setStep(3);
          } else if (data.chunk) {
            rawBuffer.current += data.chunk;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!destination.trim()) return;
    setStep(2);
    await generateItinerary();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 pt-20">
        {/* Step 1: Input Form */}
        {step === 1 && (
          <div className="max-w-3xl mx-auto px-4 py-12">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                AI 여행 플래너
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                어떤 여행을 원하세요?
              </h1>
              <p className="text-gray-500 text-lg">
                몇 가지 정보만 알려주시면 AI가 완벽한 일정을 만들어드려요
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
              {/* Destination */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  어디로 떠나고 싶으세요?
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="예: 제주도, 도쿄, 파리..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-gray-900 placeholder-gray-400"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {popularDestinations.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDestination(d)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        destination === d
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Days & People */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    여행 기간
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setDays(Math.max(1, days - 1))}
                      className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 font-bold text-gray-700"
                    >
                      -
                    </button>
                    <span className="text-2xl font-bold text-gray-900 w-16 text-center">
                      {days}박 {days + 1}일
                    </span>
                    <button
                      onClick={() => setDays(Math.min(14, days + 1))}
                      className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 font-bold text-gray-700"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{days}박 {days + 1}일</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Users className="w-4 h-4 text-blue-500" />
                    인원
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPeople(Math.max(1, people - 1))}
                      className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 font-bold text-gray-700"
                    >
                      -
                    </button>
                    <span className="text-2xl font-bold text-gray-900 w-16 text-center">
                      {people}명
                    </span>
                    <button
                      onClick={() => setPeople(Math.min(20, people + 1))}
                      className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 font-bold text-gray-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Wallet className="w-4 h-4 text-blue-500" />
                  1인 예산 (교통비 제외)
                </label>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>알뜰 여행</span>
                    <span className="font-bold text-blue-600">{formatCurrency(budget)}원 / 1인</span>
                    <span>럭셔리</span>
                  </div>
                  <input
                    type="range"
                    min={100000}
                    max={3000000}
                    step={50000}
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {[200000, 500000, 1000000, 2000000].map((b) => (
                      <button
                        key={b}
                        onClick={() => setBudget(b)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          budget === b
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-blue-50"
                        }`}
                      >
                        {formatCurrency(b)}원
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Travel Style */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">
                  여행 스타일
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "relaxed", label: "여유롭게", emoji: "🧘", desc: "힐링 중심" },
                    { id: "balanced", label: "적당히", emoji: "⚖️", desc: "균형 잡힌" },
                    { id: "packed", label: "빡빡하게", emoji: "🏃", desc: "최대한 많이" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setTravelStyle(s.id)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        travelStyle === s.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-2xl mb-1">{s.emoji}</div>
                      <div className="text-sm font-semibold text-gray-900">{s.label}</div>
                      <div className="text-xs text-gray-400">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Themes */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">
                  관심 테마 (복수 선택 가능)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => toggleTheme(t.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        selectedThemes.includes(t.id)
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-xl">{t.emoji}</span>
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!destination.trim()}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                <Sparkles className="w-5 h-5" />
                AI로 여행 일정 만들기
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Loading */}
        {step === 2 && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center px-4">
              {isLoading ? (
                <>
                  <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 animate-ping opacity-20" />
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-white animate-pulse" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    AI가 일정을 만들고 있어요
                  </h2>
                  <p className="text-gray-500 mb-2">
                    <span className="font-semibold text-blue-600">{destination}</span> {days + 1}일 일정을 분석 중...
                  </p>
                  <p className="text-gray-400 text-sm">보통 15-30초 정도 소요됩니다</p>
                  <div className="flex justify-center gap-2 mt-6">
                    {["숙소 검색 중", "맛집 탐색 중", "동선 최적화 중"].map((t, i) => (
                      <div
                        key={t}
                        className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium animate-pulse"
                        style={{ animationDelay: `${i * 0.3}s` }}
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                </>
              ) : error ? (
                <div className="max-w-md">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">오류가 발생했어요</h2>
                  <p className="text-gray-500 text-sm mb-6">{error}</p>
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
                  >
                    다시 시도하기
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && itinerary && (
          <div className="max-w-4xl mx-auto px-4 py-10">
            {/* Back button */}
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-6 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              다시 계획하기
            </button>

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
                  <div key={i} className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-green-300" />
                    {h}
                  </div>
                ))}
              </div>

              {/* Budget summary */}
              {itinerary.totalBudget && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "숙박", value: itinerary.totalBudget.accommodation, icon: "🏨" },
                    { label: "식비", value: itinerary.totalBudget.food, icon: "🍽️" },
                    { label: "교통", value: itinerary.totalBudget.transport, icon: "🚌" },
                    { label: "액티비티", value: itinerary.totalBudget.activities, icon: "🎯" },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
                      <div className="text-xl mb-1">{item.icon}</div>
                      <div className="text-xs text-blue-200 mb-1">{item.label}</div>
                      <div className="text-sm font-bold">{formatCurrency(item.value)}원</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Day plans */}
            <div className="space-y-4 mb-6">
              {itinerary.days?.map((day, idx) => (
                <div key={day.day} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
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
                      {/* Schedule */}
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
                                <p className="font-semibold text-gray-900 text-sm">{item.place}</p>
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

                      {/* Meals */}
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
                                <p className="text-xs text-orange-400 font-medium mb-1">{m.emoji} {m.label}</p>
                                <p className="text-xs text-gray-700 font-medium">{m.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Accommodation */}
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

            {/* Tips */}
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

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep(1);
                  setItinerary(null);
                }}
                className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-blue-300 hover:text-blue-600 transition-all"
              >
                다시 계획하기
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-blue-500/25 transition-all"
              >
                <Sparkles className="w-5 h-5" />
                일정 저장하기
              </button>
            </div>
          </div>
        )}
      </main>

      {step === 1 && <Footer />}
    </div>
  );
}

export default function PlannerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <PlannerContent />
    </Suspense>
  );
}
