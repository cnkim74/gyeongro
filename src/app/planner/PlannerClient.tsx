"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ItineraryView, { type Itinerary } from "@/components/ItineraryView";
import PlannerLoading from "@/components/PlannerLoading";
import { getGlobalFestival } from "@/lib/global-festivals";
import FlightSearchPanel from "@/components/FlightSearchPanel";
import HotelSearchPanel from "@/components/HotelSearchPanel";
import ActivitySearchPanel from "@/components/ActivitySearchPanel";
import CarSearchPanel from "@/components/CarSearchPanel";
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Wallet,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Bookmark,
  CheckCircle,
  HeartPulse,
  Stethoscope,
  PartyPopper,
  X,
} from "lucide-react";

const themes = [
  { id: "food", label: "미식", emoji: "🍜" },
  { id: "nature", label: "자연", emoji: "🌿" },
  { id: "culture", label: "역사·문화", emoji: "🏛️" },
  { id: "activity", label: "액티비티", emoji: "🏄" },
  { id: "healing", label: "힐링", emoji: "🧘" },
  { id: "shopping", label: "쇼핑", emoji: "🛍️" },
  { id: "nightlife", label: "나이트라이프", emoji: "🌃" },
  { id: "photo", label: "인스타 명소", emoji: "📸" },
  { id: "movie_drama", label: "영화·드라마 촬영지", emoji: "🎬" },
  { id: "anime", label: "애니메이션 성지", emoji: "🌸" },
  { id: "bbang", label: "빵지순례", emoji: "🥐" },
  { id: "local_food", label: "로컬 푸드", emoji: "🍱" },
  { id: "camping", label: "캠핑", emoji: "🏕️" },
  { id: "golf", label: "골프", emoji: "⛳" },
  { id: "kpop", label: "K-POP 성지", emoji: "🎤" },
  { id: "pet", label: "펫 동반", emoji: "🐶" },
  { id: "honeymoon", label: "허니문", emoji: "💍" },
  { id: "hiking_trekking", label: "하이킹·트레킹", emoji: "🥾" },
  { id: "onsen", label: "온천·스파", emoji: "♨️" },
  { id: "roadtrip", label: "렌트카 여행", emoji: "🚗" },
  { id: "pilgrimage", label: "성지순례", emoji: "🛐" },
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
  const router = useRouter();
  const { data: session, status } = useSession();
  const initialDestination = searchParams.get("destination") ?? "";
  const PLANNER_DRAFT_KEY = "pothos_planner_draft";
  // 서버(generate-itinerary)의 PLANNER_API_VERSION 과 같아야 함
  const PLANNER_API_VERSION = "3";

  const [step, setStep] = useState(1);
  // 해외 축제에서 넘어온 경우 (정적 목록이라 첫 렌더에서 바로 반영)
  const initialGfest = getGlobalFestival(searchParams.get("gfest"));
  const [destination, setDestination] = useState(initialGfest?.destination ?? initialDestination);
  // 출발일 (선택, YYYY-MM-DD) — 축제 기반 일정이나 요일 고려에 사용
  const [startDate, setStartDate] = useState("");
  // 축제 기반 일정 (/festivals 에서 '이 축제로 일정 만들기')
  const [festival, setFestival] = useState<{
    title: string;
    period: string;
    place?: string | null;
    addr?: string | null;
  } | null>(
    initialGfest
      ? { title: initialGfest.name, period: initialGfest.period, place: `${initialGfest.country} ${initialGfest.city}` }
      : null
  );
  const [days, setDays] = useState(3);
  const [people, setPeople] = useState(2);
  const [budget, setBudget] = useState(500000);
  const [travelStyle, setTravelStyle] = useState("balanced");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const rawBuffer = useRef("");

  // 의료관광 옵션
  const [medicalEnabled, setMedicalEnabled] = useState(false);
  const [medicalProcedure, setMedicalProcedure] = useState<string>("");
  const [medicalClinicId, setMedicalClinicId] = useState<string>("");
  const [medicalTreatmentDay, setMedicalTreatmentDay] = useState<number>(2);
  const [procedures, setProcedures] = useState<
    Array<{ slug: string; name_ko: string; emoji: string | null; recovery_days: number | null }>
  >([]);
  const [clinics, setClinics] = useState<
    Array<{ id: string; name: string; city: string; country: string }>
  >([]);

  useEffect(() => {
    if (!medicalEnabled) return;
    if (procedures.length > 0) return;
    fetch("/api/medical/options")
      .then((r) => r.json())
      .then((d) => setProcedures(d.procedures ?? []))
      .catch(() => {});
  }, [medicalEnabled, procedures.length]);

  useEffect(() => {
    if (!medicalEnabled || !medicalProcedure) return;
    const params = new URLSearchParams({ procedure: medicalProcedure });
    if (destination) params.set("destination", destination);
    let cancelled = false;
    fetch(`/api/medical/options?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setClinics(d.clinics ?? []);
      })
      .catch(() => {
        if (!cancelled) setClinics([]);
      });
    return () => {
      cancelled = true;
    };
  }, [medicalEnabled, medicalProcedure, destination]);

  // 해외 축제(AI 큐레이션·관리자 게시)에서 넘어온 경우: 확인된 개최일로 출발일까지 채우기
  useEffect(() => {
    const gid = searchParams.get("gfest");
    if (!gid || !gid.startsWith("db-")) return;
    let cancelled = false;
    fetch(`/api/global-festivals/${encodeURIComponent(gid)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((f: { name: string; period: string; country: string; city: string; destination: string; startDate?: string | null; endDate?: string | null } | null) => {
        if (cancelled || !f) return;
        const period = f.startDate
          ? `${f.startDate}${f.endDate && f.endDate !== f.startDate ? ` ~ ${f.endDate}` : ""}`
          : f.period;
        setFestival({ title: f.name, period, place: `${f.country} ${f.city}` });
        if (f.destination) setDestination(f.destination);
        const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
        if (f.startDate && f.startDate > today) setStartDate(f.startDate);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // 최초 1회
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 국내 축제에서 넘어온 경우: 축제 정보를 받아 목적지·출발일 미리 채우기
  useEffect(() => {
    const fid = searchParams.get("festival");
    if (!fid || !/^\d{1,12}$/.test(fid)) return;
    let cancelled = false;
    fetch(`/api/festivals/${fid}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((f: { title: string; startDate: string; endDate: string; addr: string; place: string | null; destination: string } | null) => {
        if (cancelled || !f) return;
        const fmt = (x: string) => (/^\d{8}$/.test(x) ? `${x.slice(0, 4)}-${x.slice(4, 6)}-${x.slice(6, 8)}` : "");
        const start = fmt(f.startDate);
        const end = fmt(f.endDate);
        setFestival({ title: f.title, period: `${start || "?"} ~ ${end || "?"}`, place: f.place, addr: f.addr });
        if (f.destination) setDestination(f.destination);
        // 출발일: 축제 시작일 (이미 시작했으면 내일, 단 종료일 이전)
        const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
        const tomorrow = new Date(Date.now() + 33 * 3600 * 1000).toISOString().slice(0, 10);
        if (start && start > today) setStartDate(start);
        else if (end && tomorrow <= end) setStartDate(tomorrow);
        else setStartDate(today);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // 최초 1회
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 회원가입 후 돌아왔을 때, 입력했던 여행 조건 복원 (1회성)
  // sessionStorage는 서버 렌더링에 없으므로 마운트 후 effect에서 복원해야 함
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PLANNER_DRAFT_KEY);
      if (!raw) return;
      sessionStorage.removeItem(PLANNER_DRAFT_KEY);
      const d = JSON.parse(raw);
      if (d.destination) setDestination(d.destination);
      if (typeof d.days === "number") setDays(d.days);
      if (typeof d.people === "number") setPeople(d.people);
      if (typeof d.budget === "number") setBudget(d.budget);
      if (d.travelStyle) setTravelStyle(d.travelStyle);
      if (Array.isArray(d.selectedThemes)) setSelectedThemes(d.selectedThemes);
      if (typeof d.medicalEnabled === "boolean") setMedicalEnabled(d.medicalEnabled);
      if (d.medicalProcedure) setMedicalProcedure(d.medicalProcedure);
      if (d.medicalClinicId) setMedicalClinicId(d.medicalClinicId);
      if (typeof d.medicalTreatmentDay === "number") setMedicalTreatmentDay(d.medicalTreatmentDay);
    } catch {
      // sessionStorage 사용 불가 환경은 무시
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleTheme = (id: string) => {
    setSelectedThemes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const generateItinerary = async () => {
    setIsLoading(true);
    setError(null);
    setNeedsAuth(false);
    setProgress(null);
    setItinerary(null);
    rawBuffer.current = "";

    try {
      const procedureMeta = procedures.find((p) => p.slug === medicalProcedure);
      const clinicMeta = clinics.find((c) => c.id === medicalClinicId);
      const medicalPayload = medicalEnabled && medicalProcedure
        ? {
            procedureSlug: medicalProcedure,
            procedureName: procedureMeta?.name_ko,
            recoveryDays: procedureMeta?.recovery_days ?? null,
            clinicId: medicalClinicId || null,
            clinicName: clinicMeta?.name ?? null,
            clinicCity: clinicMeta?.city ?? null,
            treatmentDay: medicalTreatmentDay,
          }
        : null;

      const res = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-planner-version": PLANNER_API_VERSION,
        },
        body: JSON.stringify({
          destination,
          days,
          people,
          budget: budget * people,
          travelStyle,
          themes: selectedThemes,
          medical: medicalPayload,
          startDate: startDate || null,
          festival,
        }),
      });

      // 한도/로그인 등 비-스트림 오류는 JSON 형태로 반환됨
      if (!res.ok) {
        let msg = "서버 오류가 발생했습니다.";
        try {
          const data = await res.json();
          if (res.status === 401 && data.needsLogin) {
            setNeedsAuth(true);
            msg = "AI 여행 설계는 회원 전용이에요. 회원가입 후 바로 이용할 수 있어요.";
          } else if (res.status === 409 && data.reload) {
            // 화면 코드가 서버보다 오래됨 → 입력값 보존 후 새로고침
            saveDraft();
            window.location.reload();
            return;
          } else if (res.status === 429 && data.quotaExceeded) {
            msg = `오늘의 무료 AI 플래너 한도(${data.limit}회)를 다 사용했어요. 내일 자정(KST)에 리셋됩니다.`;
          } else if (data.error) {
            msg = data.error;
          }
        } catch {
          // ignore parse error
        }
        throw new Error(msg);
      }
      if (!res.body) throw new Error("서버 오류가 발생했습니다.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      // 네트워크 조각이 줄 중간에서 끊겨도 안전하도록 버퍼링
      let sseBuffer = "";
      let finished = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));
          if (data.error) throw new Error(data.error);
          if (data.progress) {
            setProgress(data.progress);
          } else if (data.overview) {
            // 뼈대 완성 → 결과 화면을 먼저 보여주고 Day 상세는 도착하는 대로 채움
            setItinerary(data.overview as Itinerary);
            setStep(3);
            if (typeof window !== "undefined") window.scrollTo({ top: 0 });
          } else if (data.day && typeof data.day.index === "number") {
            const { index, data: dayData } = data.day as { index: number; data: Itinerary["days"][number] };
            setItinerary((prev) => {
              if (!prev) return prev;
              const days = [...prev.days];
              days[index] = dayData;
              return { ...prev, days };
            });
          } else if (data.done) {
            finished = true;
            const jsonText = rawBuffer.current.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const parsed = JSON.parse(jsonText);
            setItinerary(parsed);
            setStep(3);
          } else if (data.chunk) {
            rawBuffer.current += data.chunk;
          }
        }
      }
      if (!finished) {
        throw new Error("응답이 중간에 끊겼어요. 다시 시도해주세요.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다. 다시 시도해주세요.");
      setStep(2); // 오류 화면 (개요가 먼저 떴더라도)
    } finally {
      setIsLoading(false);
    }
  };

  // 입력한 여행 조건을 저장해 두고 (회원가입 후 복원) 인증 페이지로 이동
  const saveDraft = () => {
    try {
      sessionStorage.setItem(
        PLANNER_DRAFT_KEY,
        JSON.stringify({
          destination,
          days,
          people,
          budget,
          travelStyle,
          selectedThemes,
          medicalEnabled,
          medicalProcedure,
          medicalClinicId,
          medicalTreatmentDay,
        })
      );
    } catch {
      // 저장 실패는 무시
    }
  };

  const goAuth = (path: "/signup" | "/login") => {
    saveDraft();
    router.push(`${path}?callbackUrl=${encodeURIComponent("/planner")}`);
  };

  const handleSubmit = async () => {
    if (!destination.trim()) return;
    // AI 여행 설계는 회원 전용 — 비회원은 회원가입으로 유도 (입력값 보존)
    if (status === "unauthenticated") {
      goAuth("/signup");
      return;
    }
    setStep(2);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    await generateItinerary();
  };

  return (
    <main className="relative flex-1 pt-20 isolate">
        {/* 은은한 배경 — 하늘로 떠나는 비행기 (아래로 갈수록 배경색으로 사라짐) */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[560px] sm:h-[680px] -z-10 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/planner/airport.jpg"
            alt=""
            className="w-full h-full object-cover object-[70%_30%] opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-gray-50/50 to-gray-50" />
        </div>
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

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8 space-y-8">
              {festival && (
                <div className="flex items-start gap-3 rounded-2xl bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-100 p-4">
                  <PartyPopper className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-rose-600">축제 맞춤 일정</p>
                    <p className="text-lg font-bold text-gray-900 leading-snug">{festival.title}</p>
                    <p className="text-[15px] text-gray-600 mt-0.5">
                      {festival.period}
                      {festival.place ? ` · ${festival.place}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => setFestival(null)}
                    className="p-1 text-gray-400 hover:text-gray-700"
                    aria-label="축제 연결 해제"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Destination */}
              <div>
                <label className="flex items-center gap-2 text-base font-bold text-gray-800 mb-3">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  어디로 떠나고 싶으세요?
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="예: 도쿄  ·  프라하 → 뮌헨 → 베를린  ·  체코+독일 7일"
                  className="w-full px-4 py-4 text-lg rounded-2xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-gray-900 placeholder-gray-400"
                />
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  💡 <strong>여러 도시·국가</strong>는 화살표(→) 또는 콤마(,)로 연결하세요.
                  예: <code className="text-blue-600">프라하 → 드레스덴 → 베를린</code> 또는 <code className="text-blue-600">체코+독일 7박 8일</code>
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {popularDestinations.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDestination(d)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-base font-bold text-gray-800 mb-3">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    여행 기간
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setDays(Math.max(1, days - 1))}
                      className="w-12 h-12 text-xl rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 font-bold text-gray-700"
                    >
                      -
                    </button>
                    <span className="text-2xl font-bold text-gray-900 min-w-[6rem] text-center whitespace-nowrap">
                      {days}박 {days + 1}일
                    </span>
                    <button
                      onClick={() => setDays(Math.min(14, days + 1))}
                      className="w-12 h-12 text-xl rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 font-bold text-gray-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-base font-bold text-gray-800 mb-3">
                    <Users className="w-5 h-5 text-blue-500" />
                    인원
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPeople(Math.max(1, people - 1))}
                      className="w-12 h-12 text-xl rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 font-bold text-gray-700"
                    >
                      -
                    </button>
                    <span className="text-2xl font-bold text-gray-900 w-16 text-center">
                      {people}명
                    </span>
                    <button
                      onClick={() => setPeople(Math.min(20, people + 1))}
                      className="w-12 h-12 text-xl rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 font-bold text-gray-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 출발일 */}
              <div>
                <label className="flex items-center gap-2 text-base font-bold text-gray-800 mb-3">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  출발일 <span className="text-gray-400 font-normal">(선택)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 px-4 py-4 text-lg rounded-2xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-gray-900"
                  />
                  {startDate && (
                    <button onClick={() => setStartDate("")} className="text-sm text-gray-500 hover:text-gray-800">
                      지우기
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1.5">
                  날짜를 넣으면 요일·휴무일·축제 날짜를 고려해서 일정을 짜요
                </p>
              </div>

              {/* Budget */}
              <div>
                <label className="flex items-center gap-2 text-base font-bold text-gray-800 mb-3">
                  <Wallet className="w-5 h-5 text-blue-500" />
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
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
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
                <label className="text-base font-bold text-gray-800 mb-3 block">
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
                      className={`px-2 py-4 rounded-2xl border-2 text-center transition-all ${
                        travelStyle === s.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-2xl mb-1">{s.emoji}</div>
                      <div className="text-base font-bold text-gray-900 whitespace-nowrap">{s.label}</div>
                      <div className="text-sm text-gray-500 whitespace-nowrap">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Themes */}
              <div>
                <label className="text-base font-bold text-gray-800 mb-3 block">
                  관심 테마 (복수 선택 가능)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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
                      <span className="text-sm font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 의료관광 통합 */}
              <div className="rounded-2xl border-2 border-rose-100 bg-gradient-to-br from-rose-50/50 to-pink-50/50 p-5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={medicalEnabled}
                    onChange={(e) => setMedicalEnabled(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-rose-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-rose-500" />
                      <span className="text-sm font-bold text-slate-900">
                        의료관광 일정 포함
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      시술·검진을 일정에 포함하면 AI가 회복 기간을 고려해 부담 없는 코스를 짜요.
                    </p>
                  </div>
                </label>

                {medicalEnabled && (
                  <div className="mt-5 space-y-4 pl-7">
                    {/* 시술 선택 */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">
                        시술 종류
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {procedures.map((p) => (
                          <button
                            key={p.slug}
                            type="button"
                            onClick={() => {
                              setMedicalProcedure(p.slug);
                              setMedicalClinicId("");
                              setClinics([]);
                            }}
                            className={`p-3 rounded-xl border-2 transition-all text-center ${
                              medicalProcedure === p.slug
                                ? "border-rose-500 bg-rose-50"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="text-2xl mb-1">{p.emoji}</div>
                            <div className="text-sm font-semibold text-slate-900">
                              {p.name_ko}
                            </div>
                            {p.recovery_days && (
                              <div className="text-sm text-slate-500 mt-0.5">
                                회복 {p.recovery_days}일
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 클리닉 선택 (있으면) */}
                    {medicalProcedure && clinics.length > 0 && (
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">
                          클리닉 선택{" "}
                          <span className="text-slate-400 font-normal">
                            (선택, 미선택 시 도시만 반영)
                          </span>
                        </label>
                        <select
                          value={medicalClinicId}
                          onChange={(e) => setMedicalClinicId(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-slate-900 text-sm bg-white"
                        >
                          <option value="">선택 안 함</option>
                          {clinics.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.city})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* 시술일 선택 */}
                    {medicalProcedure && (
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">
                          시술 받는 날
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {Array.from({ length: days + 1 }, (_, i) => i + 1).map(
                            (d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setMedicalTreatmentDay(d)}
                                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                                  medicalTreatmentDay === d
                                    ? "bg-rose-500 text-white"
                                    : "bg-white border border-slate-200 text-slate-600 hover:border-rose-300"
                                }`}
                              >
                                Day {d}
                              </button>
                            )
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-2">
                          <Stethoscope className="w-3 h-3 inline mr-0.5" />
                          시술일 이후 회복 기간은 가벼운 일정으로 자동 조정됩니다.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={
                  !destination.trim() ||
                  (medicalEnabled && !medicalProcedure)
                }
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                <Sparkles className="w-5 h-5" />
                {status === "unauthenticated"
                  ? "회원가입하고 AI 여행 설계 받기"
                  : "AI로 여행 일정 만들기"}
                <ArrowRight className="w-5 h-5" />
              </button>

              {status === "unauthenticated" && (
                <p className="text-center text-sm text-gray-400 mt-3">
                  AI 여행 설계는 회원 전용이에요. 가입은 10초면 끝나요.
                  <br />
                  이미 회원이신가요?{" "}
                  <button
                    onClick={() => goAuth("/login")}
                    className="text-blue-500 font-semibold hover:underline"
                  >
                    로그인
                  </button>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Loading */}
        {step === 2 && isLoading && (
          <PlannerLoading destination={destination} totalDays={days + 1} progress={progress} />
        )}
        {step === 2 && !isLoading && (
          <div className="fixed inset-0 z-[60] bg-gray-50 flex items-center justify-center">
            <div className="text-center px-4">
              {error ? (
                <div className="max-w-md">
                  {needsAuth ? (
                    <Sparkles className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  ) : (
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  )}
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {needsAuth ? "회원가입이 필요해요" : "오류가 발생했어요"}
                  </h2>
                  <p className="text-gray-500 text-sm mb-6">{error}</p>
                  {needsAuth ? (
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => goAuth("/signup")}
                        className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:shadow-lg transition-all"
                      >
                        회원가입하고 시작
                      </button>
                      <button
                        onClick={() => goAuth("/login")}
                        className="px-6 py-3 rounded-full border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                      >
                        로그인
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setStep(1)}
                      className="px-6 py-3 rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
                    >
                      다시 시도하기
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && itinerary && (
          <div className="max-w-4xl mx-auto px-4 py-10">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-6 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              다시 계획하기
            </button>

            {isLoading && (
              <div className="sticky top-20 z-30 mb-4 flex items-center gap-3 rounded-2xl bg-blue-600 text-white px-4 py-3 shadow-lg">
                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                <div className="min-w-0">
                  <p className="text-[15px] font-bold">AI가 나머지 일정을 채우고 있어요</p>
                  {progress && <p className="text-sm text-blue-100 truncate">{progress}</p>}
                </div>
              </div>
            )}
            <ItineraryView itinerary={itinerary} destination={destination} generating={isLoading} />

            {/* 항공편 메타서치 */}
            <div className="mt-6">
              <FlightSearchPanel
                toCity={destination}
                days={days}
                adults={people}
              />
            </div>

            {/* 호텔 메타서치 */}
            <div className="mt-4">
              <HotelSearchPanel
                destination={destination}
                nights={days}
                adults={people}
              />
            </div>

            {/* 액티비티 메타서치 */}
            <div className="mt-4">
              <ActivitySearchPanel destination={destination} />
            </div>

            {/* 렌트카 메타서치 */}
            <div className="mt-4">
              <CarSearchPanel pickupCity={destination} nights={days} />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setStep(1);
                  setItinerary(null);
                  setSavedId(null);
                }}
                className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-blue-300 hover:text-blue-600 transition-all"
              >
                다시 계획하기
              </button>
              {savedId ? (
                <button
                  onClick={() => router.push("/my-trips")}
                  className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all"
                >
                  <CheckCircle className="w-5 h-5" />
                  저장됨 · 내 여행 보기
                </button>
              ) : (
                <button
                  onClick={async () => {
                    if (!session?.user) {
                      router.push(`/login?callbackUrl=${encodeURIComponent("/planner")}`);
                      return;
                    }
                    setSaving(true);
                    try {
                      const res = await fetch("/api/trips", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          title: itinerary.title,
                          destination,
                          days,
                          people,
                          budget: budget * people,
                          travelStyle,
                          themes: selectedThemes,
                          itinerary,
                        }),
                      });
                      if (!res.ok) throw new Error();
                      const { id } = await res.json();
                      setSavedId(id);
                    } catch {
                      alert("저장 중 오류가 발생했어요. 다시 시도해주세요.");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving || isLoading}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-blue-500/25 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Bookmark className="w-5 h-5" />
                  )}
                  {session?.user ? "내 여행에 저장" : "로그인하고 저장"}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
  );
}

export default function PlannerClient() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <PlannerContent />
    </Suspense>
  );
}
