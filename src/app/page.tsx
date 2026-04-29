import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StarRating from "@/components/StarRating";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  Sparkles,
  ArrowRight,
  Compass,
  Map,
  Wallet,
  Users,
  Camera,
  Layers,
  CheckCircle,
  Clapperboard,
  Croissant,
  Mountain,
  BookOpen,
  HandshakeIcon,
  ChevronRight,
  Anchor,
  Castle,
  Landmark,
  TreePalm,
  Building2,
  Plane,
  Hotel,
  Car,
  Globe,
  MessageCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getLandingReviews() {
  try {
    const supabase = getSupabaseServiceClient();
    const { data: reviews } = await supabase
      .from("reviews")
      .select("id, title, content, rating, destination, created_at, user_id")
      .eq("is_deleted", false)
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3);

    if (!reviews || reviews.length === 0) return [];

    const userIds = [...new Set(reviews.map((r) => r.user_id))];
    const { data: users } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id, name, image, custom_image")
      .in("id", userIds);

    const usersMap: Record<string, { name: string | null; image: string | null }> = {};
    for (const u of users ?? []) {
      usersMap[u.id] = { name: u.name, image: u.custom_image ?? u.image };
    }

    return reviews.map((r) => ({
      ...r,
      author: usersMap[r.user_id] ?? { name: null, image: null },
    }));
  } catch {
    return [];
  }
}

const features = [
  {
    icon: Compass,
    title: "AI 맞춤 일정",
    description:
      "취향, 스타일, 예산을 분석해 세상에 하나뿐인 나만의 동선을 30초 만에 제안합니다.",
  },
  {
    icon: Wallet,
    title: "예산 최적화",
    description:
      "숙소·식사·이동 비용을 균형 있게 분배하고, 지역별 시세를 반영해 합리적인 코스를 만들어드려요.",
  },
  {
    icon: HandshakeIcon,
    title: "여행 동료 매칭",
    description:
      "혼자보다 함께가 좋은 순간이 있죠. 같은 곳을 향하는 동료를 찾아 일정과 비용을 나눠보세요.",
  },
  {
    icon: BookOpen,
    title: "독창적 여행 공유",
    description:
      "당신만의 스토리, 사진과 글로 여행을 기록하고 공유합니다. 일정이 추억이 되는 곳.",
  },
  {
    icon: Layers,
    title: "테마별 큐레이션",
    description:
      "영화 촬영지, 애니메이션 성지, 빵지순례 등 보통의 가이드북에 없는 코스도 함께합니다.",
  },
  {
    icon: Map,
    title: "구글맵 동선 시각화",
    description:
      "각 일정을 지도에서 확인하고, 하루 동선을 한눈에 보세요. 길 찾는 시간 대신 즐기는 시간을.",
  },
];

const themes = [
  { icon: Clapperboard, label: "영화·드라마", color: "text-rose-500", bg: "bg-rose-50" },
  { icon: Sparkles, label: "애니 성지", color: "text-pink-500", bg: "bg-pink-50" },
  { icon: Croissant, label: "빵지순례", color: "text-amber-600", bg: "bg-amber-50" },
  { icon: Mountain, label: "자연·트레킹", color: "text-emerald-500", bg: "bg-emerald-50" },
  { icon: Camera, label: "포토 스팟", color: "text-purple-500", bg: "bg-purple-50" },
  { icon: Users, label: "동료와 함께", color: "text-blue-500", bg: "bg-blue-50" },
];

const destinations = [
  {
    name: "제주",
    subtitle: "Jeju Island",
    tag: "국내 인기",
    icon: Mountain,
    desc: "한라산 · 바다",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    name: "도쿄",
    subtitle: "Tokyo",
    tag: "해외 인기",
    icon: Building2,
    desc: "메가시티 · 미식",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    name: "부산",
    subtitle: "Busan",
    tag: "주말 추천",
    icon: Anchor,
    desc: "항구 · 야경",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    name: "오사카",
    subtitle: "Osaka",
    tag: "미식",
    icon: Castle,
    desc: "성 · 도톤보리",
    gradient: "from-orange-500 to-red-600",
  },
  {
    name: "파리",
    subtitle: "Paris",
    tag: "유럽",
    icon: Landmark,
    desc: "에펠탑 · 예술",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    name: "방콕",
    subtitle: "Bangkok",
    tag: "동남아",
    icon: TreePalm,
    desc: "사원 · 야시장",
    gradient: "from-amber-500 to-yellow-600",
  },
];

const howItWorks = [
  {
    num: "01",
    title: "여행 정보 입력",
    desc: "목적지, 기간, 예산을 알려주세요",
  },
  {
    num: "02",
    title: "AI가 일정 설계",
    desc: "30초 만에 맞춤 코스가 완성됩니다",
  },
  {
    num: "03",
    title: "동료·후기·지도까지",
    desc: "함께 떠날 사람과 정보를 한 곳에서",
  },
];

export default async function HomePage() {
  const reviews = await getLandingReviews();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      {/* Hero - 모던하고 강한 비주얼 */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
        {/* Aurora — 다층 색상 그라디언트 */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-1/4 w-[600px] h-[400px] bg-blue-500/25 rounded-full blur-[140px]" />
          <div className="absolute bottom-20 right-1/4 w-[700px] h-[500px] bg-indigo-500/25 rounded-full blur-[140px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-500/15 rounded-full blur-[120px]" />
          {/* 오로라 청록 띠 */}
          <div className="absolute top-1/3 left-0 right-0 h-[200px] bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent blur-[80px] -rotate-6" />
          {/* 오로라 그린 띠 (왼쪽 상단) */}
          <div className="absolute top-0 left-0 w-[500px] h-[300px] bg-emerald-400/10 rounded-full blur-[120px]" />
          {/* 오로라 핑크 점 (우하단) */}
          <div className="absolute bottom-0 right-1/3 w-[400px] h-[300px] bg-fuchsia-500/10 rounded-full blur-[100px]" />
        </div>

        {/* 별 패턴 */}
        <div
          className="absolute inset-0 opacity-80 mix-blend-screen pointer-events-none"
          style={{
            backgroundImage: "url('/patterns/stars.svg')",
            backgroundRepeat: "repeat",
            backgroundSize: "1200px 800px",
          }}
        />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-32 w-full">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-white/70 text-xs font-medium mb-8 tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>AI 플래너 · 셰르파 매칭 · 항공·호텔·렌트카 가격 비교</span>
            </div>

            <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-8">
              여행은,
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                길에서 시작됩니다
              </span>
            </h1>

            <p className="text-base sm:text-2xl text-white/60 max-w-2xl mb-10 leading-relaxed font-light">
              취향과 예산만 알려주세요. AI가 30초 만에 맞춤 일정을 설계하고,
              <br className="hidden sm:block" />
              현지 셰르파부터 항공·호텔까지 한 곳에서 만들어 드립니다.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/planner"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-slate-950 font-semibold text-base hover:bg-blue-50 transition-all hover:-translate-y-0.5"
              >
                <Compass className="w-5 h-5" />
                AI 여행 시작하기
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/sherpa"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-semibold text-base hover:bg-white/10 transition-colors backdrop-blur-md"
              >
                <Mountain className="w-5 h-5" />
                셰르파 만나기
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-16 text-white/40 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                AI 무료 (일 5회)
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                현지 셰르파 1:1
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                항공·호텔 비교
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                다국어 자동 번역
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* 메타서치 4종 — 매출 채널 강조 */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-blue-600 mb-2 tracking-widest">
              ALL-IN-ONE
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
              항공·호텔·액티비티·렌트카
              <br className="sm:hidden" />
              <span className="text-slate-400"> </span>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                한 곳에서 비교
              </span>
            </h2>
            <p className="text-slate-500 text-sm">
              Trip.com · Booking.com · Skyscanner · KKday · Klook 등 글로벌 12개 사이트 동시 비교
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                href: "/flights",
                icon: Plane,
                label: "항공권",
                providers: "Trip.com · Skyscanner",
                color: "from-sky-500 to-blue-600",
                bg: "bg-sky-50",
                accent: "text-sky-600",
              },
              {
                href: "/hotels",
                icon: Hotel,
                label: "호텔",
                providers: "Trip · Booking · Agoda",
                color: "from-violet-500 to-purple-600",
                bg: "bg-violet-50",
                accent: "text-violet-600",
              },
              {
                href: "/activities",
                icon: Sparkles,
                label: "액티비티",
                providers: "KKday · Klook · GYG",
                color: "from-amber-500 to-orange-600",
                bg: "bg-amber-50",
                accent: "text-amber-600",
              },
              {
                href: "/cars",
                icon: Car,
                label: "렌트카",
                providers: "Trip · Rentalcars · DiscoverCars",
                color: "from-teal-500 to-cyan-600",
                bg: "bg-teal-50",
                accent: "text-teal-600",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative ${item.bg} rounded-2xl p-5 border border-transparent hover:border-current transition-all hover:-translate-y-1 hover:shadow-lg`}
                >
                  <div
                    className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} text-white mb-3 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {item.label}
                  </h3>
                  <p className={`text-[10px] sm:text-xs ${item.accent} font-medium leading-tight break-keep`}>
                    {item.providers}
                  </p>
                  <ArrowRight className="absolute top-4 right-4 sm:top-5 sm:right-5 w-4 h-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-5">
            💡 일정 만들면 4가지 가격 비교가 자동으로 함께 나옵니다
          </p>
        </div>
      </section>

      {/* Quick destinations */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-semibold text-blue-600 mb-2 tracking-wide">
                POPULAR DESTINATIONS
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                지금 가장 많이 떠나는 곳
              </h2>
            </div>
            <Link
              href="/planner"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-blue-600"
            >
              더 보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {destinations.map((d) => {
              const Icon = d.icon;
              return (
                <Link
                  key={d.name}
                  href={`/planner?destination=${d.name}`}
                  className={`group relative aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br ${d.gradient} hover:shadow-xl transition-all hover:-translate-y-1`}
                >
                  {/* Subtle radial overlay for depth */}
                  <div
                    className="absolute inset-0 opacity-50"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at top right, rgba(255,255,255,0.25), transparent 60%)",
                    }}
                  />

                  {/* Tag at top */}
                  <span className="absolute top-3 left-3 z-10 inline-flex text-[10px] font-bold tracking-wider text-white/85 uppercase bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    {d.tag}
                  </span>

                  {/* Big icon centered */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="w-14 h-14 sm:w-16 sm:h-16 text-white/90 stroke-[1.5] group-hover:scale-110 transition-transform duration-500 drop-shadow-lg" />
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h3 className="text-lg sm:text-xl font-bold leading-tight drop-shadow">
                      {d.name}
                    </h3>
                    <p className="text-[10px] text-white/70 font-medium tracking-wide">
                      {d.subtitle}
                    </p>
                    <p className="text-[10px] text-white/85 mt-1">{d.desc}</p>
                  </div>

                  {/* Hover arrow */}
                  <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-2">
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features - Modern card grid */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <p className="text-sm font-semibold text-blue-600 mb-3 tracking-wide">
              WHY POTHOS
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              여행을 다르게,
              <br />
              그러나 더 단순하게
            </h2>
            <p className="text-lg text-slate-500">
              AI 일정부터 셰르파, 항공·호텔 비교까지. 흩어진 여행의 모든 단계를 한 곳에 모았습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group bg-white rounded-3xl p-8 border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
                    {f.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 셰르파 매칭 — Pothos의 핵심 차별화 */}
      <section className="py-24 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-amber-700 mb-3 tracking-wide">
                LOCAL EXPERT
              </p>
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4 leading-tight">
                현지 전문가,
                <br />
                <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  셰르파와 함께
                </span>
              </h2>
              <p className="text-base text-slate-500 leading-relaxed mb-2 italic">
                * 셰르파 = 히말라야에서 등반가의 길을 안내하던 사람들. Pothos는
                이 단어를 빌려 당신의 여정에 함께 걷는 모든 현지 전문가를 셰르파라고 부릅니다.
              </p>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                도쿄에서 푸드 투어, 발리에서 서핑 강습, 강남에서 의료 통역까지.
                <br />
                AI 매칭으로 당신에게 딱 맞는 셰르파를 찾아드립니다.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  { icon: Users, label: "1:1 직접 예약 또는 제안 매칭" },
                  { icon: Globe, label: "다국어 자동 번역 (한·영·일·중)" },
                  { icon: MessageCircle, label: "DM으로 일정 직접 조율" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 text-slate-700"
                    >
                      <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-amber-600 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/sherpa"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-amber-600 text-white font-semibold text-sm hover:bg-amber-700 transition-all hover:-translate-y-0.5"
                >
                  <Mountain className="w-4 h-4" />
                  셰르파 둘러보기
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/sherpa/become"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white border border-amber-200 text-amber-700 font-semibold text-sm hover:border-amber-300 transition-all"
                >
                  나도 셰르파 되기
                </Link>
              </div>
            </div>

            {/* 카테고리 미리보기 */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { emoji: "🗺️", label: "도시 가이드", desc: "현지 동선·맛집" },
                { emoji: "💬", label: "통역", desc: "한·영·일·중" },
                { emoji: "🍜", label: "푸드 투어", desc: "현지 노포" },
                { emoji: "📷", label: "사진가", desc: "인생샷 코스" },
                { emoji: "🏥", label: "의료 통역", desc: "병원 동행" },
                { emoji: "🚗", label: "차량·동행", desc: "공항·관광" },
              ].map((c) => (
                <div
                  key={c.label}
                  className="bg-white rounded-2xl p-4 border border-amber-100 hover:border-amber-300 hover:shadow-md transition-all"
                >
                  <p className="text-3xl mb-2">{c.emoji}</p>
                  <p className="font-bold text-slate-900 text-sm">{c.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Themes */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 mb-3 tracking-wide">
              CURATED THEMES
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              평범하지 않은 여행
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              가이드북에 없는 코스로 당신만의 여행을 만들어보세요
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
            {themes.map((t) => {
              const Icon = t.icon;
              return (
                <Link
                  key={t.label}
                  href="/themes"
                  className={`group flex flex-col items-center justify-center gap-3 aspect-square rounded-2xl ${t.bg} border border-transparent hover:border-current transition-all hover:-translate-y-1`}
                >
                  <Icon className={`w-8 h-8 ${t.color}`} />
                  <span className="text-sm font-semibold text-slate-700">{t.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="text-center">
            <Link
              href="/themes"
              className="inline-flex items-center gap-2 text-base font-semibold text-blue-600 hover:text-blue-700"
            >
              모든 테마 보기 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works - clean numbered steps */}
      <section className="py-24 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-400 mb-3 tracking-wide">
              HOW IT WORKS
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              세 번의 클릭으로 시작
            </h2>
            <p className="text-lg text-white/60">복잡한 가입도, 결제도 없습니다</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {howItWorks.map((step, i) => (
              <div key={step.num} className="relative">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md hover:bg-white/10 transition-colors h-full">
                  <p className="text-7xl font-bold text-white/10 mb-4 leading-none">
                    {step.num}
                  </p>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-white/60 leading-relaxed">{step.desc}</p>
                </div>
                {i < howItWorks.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 text-white/20 z-10" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link
              href="/planner"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-slate-950 font-semibold hover:bg-blue-50 transition-all"
            >
              지금 바로 시작하기 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews — 후기 있으면 노출, 없으면 fallback 섹션 */}
      {reviews.length > 0 ? (
        <section className="py-24 bg-slate-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-sm font-semibold text-blue-600 mb-3 tracking-wide">
                  REAL TRAVELERS
                </p>
                <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
                  여행자들의 이야기
                </h2>
              </div>
              <Link
                href="/reviews"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-blue-600"
              >
                전체 후기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {reviews.map((r) => {
                const initial = (r.author?.name ?? "익").charAt(0).toUpperCase();
                return (
                  <Link
                    key={r.id}
                    href={`/reviews/${r.id}`}
                    className="group bg-white rounded-3xl p-7 border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all"
                  >
                    <StarRating value={r.rating} readonly size="sm" />
                    <h3 className="text-lg font-bold text-slate-900 mt-4 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {r.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3">
                      {r.content}
                    </p>
                    <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                      {r.author?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.author.image}
                          alt={r.author.name ?? ""}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                          {initial}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {r.author?.name ?? "익명"}
                        </p>
                        {r.destination && (
                          <p className="text-xs text-slate-400">{r.destination}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        // 후기 0건 fallback — 공급자 측(셰르파/파트너) 모집 강조
        <section className="py-24 bg-slate-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-blue-600 mb-3 tracking-wide">
                JOIN US
              </p>
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4">
                Pothos와 함께할 분을 찾습니다
              </h2>
              <p className="text-lg text-slate-500">
                여행자·셰르파·파트너 — 다양한 역할로 합류하세요
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Link
                href="/signup"
                className="group bg-white rounded-3xl p-7 border border-slate-100 hover:border-blue-300 hover:shadow-lg transition-all"
              >
                <div className="text-4xl mb-3">🧳</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600">
                  여행자로 시작
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  AI 일정 + 셰르파 매칭 + 항공·호텔 비교를 무료로 시작
                </p>
                <p className="mt-4 text-xs font-semibold text-blue-600 inline-flex items-center gap-1">
                  지금 가입 <ArrowRight className="w-3 h-3" />
                </p>
              </Link>

              <Link
                href="/sherpa/become"
                className="group bg-white rounded-3xl p-7 border border-slate-100 hover:border-amber-300 hover:shadow-lg transition-all"
              >
                <div className="text-4xl mb-3">🏔️</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-amber-600">
                  셰르파(현지 전문가)로 활동
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  도시 가이드·통역·푸드·사진·의료 동행 — 자기 동네의 셰르파가
                  되어보세요
                </p>
                <p className="mt-4 text-xs font-semibold text-amber-600 inline-flex items-center gap-1">
                  셰르파 신청 <ArrowRight className="w-3 h-3" />
                </p>
              </Link>

              <Link
                href="/sponsor"
                className="group bg-white rounded-3xl p-7 border border-slate-100 hover:border-emerald-300 hover:shadow-lg transition-all"
              >
                <div className="text-4xl mb-3">🏢</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-600">
                  파트너로 합류
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  병원·여행사·항공·렌탈 등 — 여행자 트래픽으로 매출 확장
                </p>
                <p className="mt-4 text-xs font-semibold text-emerald-600 inline-flex items-center gap-1">
                  파트너십 문의 <ArrowRight className="w-3 h-3" />
                </p>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-32 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl sm:text-6xl font-bold text-slate-900 tracking-tight mb-6">
            이번 여행은,
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Pothos와 함께
            </span>
          </h2>
          <p className="text-lg text-slate-500 mb-10">
            가입 없이도 시작할 수 있어요. 30초면 충분합니다.
          </p>
          <Link
            href="/planner"
            className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-slate-900 text-white font-semibold text-lg hover:bg-slate-800 transition-all hover:-translate-y-0.5"
          >
            <Compass className="w-5 h-5" />
            AI 여행 플래너 시작
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
