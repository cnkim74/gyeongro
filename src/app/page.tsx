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
  { name: "제주", subtitle: "Jeju Island", tag: "국내 인기" },
  { name: "도쿄", subtitle: "Tokyo", tag: "해외 인기" },
  { name: "부산", subtitle: "Busan", tag: "주말 추천" },
  { name: "오사카", subtitle: "Osaka", tag: "미식" },
  { name: "파리", subtitle: "Paris", tag: "유럽" },
  { name: "방콕", subtitle: "Bangkok", tag: "동남아" },
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
        {/* Background gradient orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-1/4 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
        </div>

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
              <span>AI 여행 플래너 · 동료 매칭 · 큐레이션 테마</span>
            </div>

            <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-8">
              여행은,
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                길에서 시작됩니다
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-white/60 max-w-2xl mb-12 leading-relaxed font-light">
              취향과 예산만 알려주세요. AI가 30초 만에 맞춤 일정을 설계하고,
              <br className="hidden sm:block" />
              같은 길을 걷는 동료를 찾아드립니다.
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
                href="/themes"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-semibold text-base hover:bg-white/10 transition-colors backdrop-blur-md"
              >
                테마 여행 둘러보기
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-16 text-white/40 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                완전 무료
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                30초 완성
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                여행 동료 매칭
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                맞춤 큐레이션
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
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
            {destinations.map((d) => (
              <Link
                key={d.name}
                href={`/planner?destination=${d.name}`}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 hover:shadow-xl transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div
                  className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at center, rgba(99,102,241,0.4), transparent 70%)",
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <p className="text-[10px] font-semibold tracking-wider text-white/60 mb-1">
                    {d.tag}
                  </p>
                  <h3 className="text-2xl font-bold mb-0.5 group-hover:translate-x-1 transition-transform">
                    {d.name}
                  </h3>
                  <p className="text-xs text-white/50">{d.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Modern card grid */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <p className="text-sm font-semibold text-blue-600 mb-3 tracking-wide">
              WHY GYEONGRO
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              여행을 다르게,
              <br />
              그러나 더 단순하게
            </h2>
            <p className="text-lg text-slate-500">
              계획부터 동료 찾기, 후기 공유까지. 흩어진 여행의 모든 단계를 한 곳에 모았습니다.
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

      {/* Reviews */}
      {reviews.length > 0 && (
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
      )}

      {/* Final CTA */}
      <section className="py-32 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-5xl sm:text-6xl font-bold text-slate-900 tracking-tight mb-6">
            이번 여행은,
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              경로와 함께
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
