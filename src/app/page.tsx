import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StarRating from "@/components/StarRating";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  Sparkles,
  MapPin,
  Clock,
  Wallet,
  Users,
  ArrowRight,
  CheckCircle,
  Zap,
  Globe,
  Heart,
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
      .limit(6);

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
    icon: Sparkles,
    title: "AI 맞춤 일정",
    description: "취향, 여행 스타일, 예산을 분석해 세상에 하나뿐인 나만의 여행 일정을 만들어드려요.",
    color: "from-purple-500 to-indigo-500",
    bg: "bg-purple-50",
  },
  {
    icon: Clock,
    title: "30초 만에 완성",
    description: "몇 가지 질문에 답하면 AI가 즉시 상세한 여행 계획을 제안합니다. 복잡한 검색은 이제 그만.",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50",
  },
  {
    icon: Wallet,
    title: "예산 최적화",
    description: "입력한 예산 범위 내에서 숙소, 식사, 액티비티를 최적으로 조합해 여행 비용을 절약해드려요.",
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
  },
  {
    icon: Globe,
    title: "국내외 전 지역",
    description: "제주, 부산, 강릉부터 도쿄, 파리, 뉴욕까지. 전 세계 어디든 경로가 함께합니다.",
    color: "from-orange-500 to-rose-500",
    bg: "bg-orange-50",
  },
  {
    icon: Users,
    title: "동행 유형 맞춤",
    description: "혼자 여행, 커플, 가족, 친구 모임 등 동행 유형에 따라 최적화된 코스를 추천해드려요.",
    color: "from-pink-500 to-rose-500",
    bg: "bg-pink-50",
  },
  {
    icon: Heart,
    title: "테마 여행",
    description: "미식, 자연, 역사문화, 액티비티, 힐링 등 원하는 테마를 선택해 특별한 여행을 경험하세요.",
    color: "from-red-500 to-orange-500",
    bg: "bg-red-50",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "여행 정보 입력",
    description: "목적지, 기간, 인원, 예산, 여행 스타일을 간단히 입력하세요.",
  },
  {
    step: "02",
    title: "AI 분석 & 생성",
    description: "Claude AI가 수천 개의 여행 데이터를 분석해 최적의 일정을 만들어드립니다.",
  },
  {
    step: "03",
    title: "일정 확인 & 수정",
    description: "제안된 일정을 확인하고 원하는 대로 자유롭게 수정하세요.",
  },
  {
    step: "04",
    title: "여행 출발!",
    description: "완성된 일정을 저장하고 즐거운 여행을 떠나세요.",
  },
];

const destinations = [
  { name: "제주도", emoji: "🌊", tag: "국내 인기 1위" },
  { name: "도쿄", emoji: "🗼", tag: "해외 인기 1위" },
  { name: "부산", emoji: "🎡", tag: "국내 인기 2위" },
  { name: "파리", emoji: "🗺️", tag: "유럽 인기 1위" },
  { name: "오사카", emoji: "🍜", tag: "미식 여행" },
  { name: "강릉", emoji: "🌿", tag: "자연 힐링" },
];

export default async function HomePage() {
  const reviews = await getLandingReviews();
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-950 via-blue-950 to-indigo-950">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }} />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-white/80 text-sm mb-8">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>Claude AI 기반 여행 플래너</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
            AI가 설계하는
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
              나만의 여행
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            취향, 예산, 일정만 알려주세요.
            <br />
            경로 AI가 세상에 하나뿐인 완벽한 여행 코스를 30초 만에 만들어드립니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/planner"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-lg shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 transition-all duration-200"
            >
              <Sparkles className="w-5 h-5" />
              무료로 여행 계획 시작
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/10 border border-white/20 text-white font-semibold text-lg hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              이용 방법 보기
            </a>
          </div>

          <div className="flex items-center justify-center gap-8 mt-14 text-white/50 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>완전 무료</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>가입 불필요</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>30초 완성</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 text-xs">
          <span>스크롤하여 더 보기</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-sm font-medium text-gray-400 mb-8 tracking-widest uppercase">인기 여행지</p>
          <div className="flex gap-4 overflow-x-auto pb-2 justify-center flex-wrap">
            {destinations.map((dest) => (
              <Link
                key={dest.name}
                href={`/planner?destination=${dest.name}`}
                className="flex-shrink-0 flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all"
              >
                <span className="text-2xl">{dest.emoji}</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{dest.name}</p>
                  <p className="text-xs text-gray-400">{dest.tag}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">경로가 특별한 이유</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              단순한 일정 추천을 넘어, AI가 진짜 나만을 위한 여행을 설계합니다
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group p-7 rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-2xl ${feature.bg} flex items-center justify-center mb-5`}>
                    <div className={`bg-gradient-to-br ${feature.color} rounded-xl w-10 h-10 flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-blue-950 to-indigo-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">이렇게 쉬워요</h2>
            <p className="text-white/60 text-lg">복잡한 여행 계획, 경로가 대신해드립니다</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {howItWorks.map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-white/20 to-transparent" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-5 backdrop-blur-sm">
                  <span className="text-2xl font-bold bg-gradient-to-br from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-14">
            <Link
              href="/planner"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-indigo-700 font-bold text-lg hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-1 transition-all"
            >
              지금 바로 시작하기 <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="testimonials" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">여행자들의 이야기</h2>
            <p className="text-gray-500 text-lg">경로와 함께한 실제 여행 후기</p>
          </div>

          {reviews.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center max-w-xl mx-auto">
              <p className="text-gray-500 mb-4">
                곧 첫 후기가 올라올 거예요. 경로와 함께한 여행 이야기를 들려주세요!
              </p>
              <Link
                href="/reviews/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600"
              >
                <Sparkles className="w-4 h-4" />첫 후기 남기기
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((r) => {
                  const initial = (r.author?.name ?? "익").charAt(0).toUpperCase();
                  return (
                    <Link
                      key={r.id}
                      href={`/reviews/${r.id}`}
                      className="group bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <StarRating value={r.rating} readonly size="sm" />
                        {r.destination && (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-500 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                            <MapPin className="w-3 h-3" />
                            {r.destination}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {r.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-5 line-clamp-3">
                        {r.content}
                      </p>
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
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
                          <p className="font-semibold text-gray-900 text-sm">
                            {r.author?.name ?? "익명"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(r.created_at).toLocaleDateString("ko-KR")}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="text-center mt-10">
                <Link
                  href="/reviews"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-gray-200 text-gray-700 font-semibold hover:border-blue-300 hover:text-blue-600 transition-all"
                >
                  모든 후기 보기 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-8 shadow-xl shadow-blue-500/30">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            다음 여행, 경로와 함께 시작하세요
          </h2>
          <p className="text-gray-500 text-lg mb-10">
            AI가 설계하는 맞춤 여행 — 지금 바로, 무료로 시작할 수 있어요
          </p>
          <Link
            href="/planner"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 transition-all duration-200"
          >
            <Sparkles className="w-5 h-5" />
            AI 여행 플래너 시작
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
