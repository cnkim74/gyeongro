import Link from "next/link";
import FirstPostEventBanner from "@/components/FirstPostEventBanner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { CheckCircle, ExternalLink, SquarePlay as Youtube, PenSquare, Compass } from "lucide-react";
import { GUIDE_TOPICS, OWNER_CHANNEL, FEATURED_CREATORS } from "@/lib/travel-guide";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { extractYouTube, youtubeThumb, youtubeWatchUrl } from "@/lib/youtube";
import GuideTools from "./GuideTools";
import AffiliateStrip from "@/components/AffiliateStrip";
import { getActiveProducts } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "여행 준비 가이드 - Pothos",
  description: "여권·국제운전면허·해외 안전·렌터카·환전·짐싸기까지, 공식 정보와 추천 영상으로 한 번에 준비하세요.",
};

/** 커뮤니티 '여행 유튜브' 게시판 최신 글 */
async function getCommunityVideos() {
  try {
    const supabase = getSupabaseServiceClient();
    const { data: board } = await supabase.from("boards").select("id").eq("slug", "youtube").maybeSingle();
    if (!board) return [];
    const { data } = await supabase
      .from("posts")
      .select("id, title, content")
      .eq("board_id", board.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(6);
    return (data ?? [])
      .map((p) => ({ id: p.id as string, title: p.title as string, videoId: extractYouTube(String(p.content ?? "")).videoIds[0] }))
      .filter((p) => p.videoId);
  } catch {
    return [];
  }
}

export default async function TravelGuidePage() {
  const [community, products] = await Promise.all([getCommunityVideos(), getActiveProducts()]);
  // 인기 여행 유튜버 영상 — 채널이 골고루 섞이도록 번갈아 배치
  const maxLen = Math.max(...FEATURED_CREATORS.map((c) => c.videos.length));
  const creatorVideos = Array.from({ length: maxLen }, (_, i) =>
    FEATURED_CREATORS.flatMap((c) => (c.videos[i] ? [{ ...c.videos[i], channel: c.name }] : []))
  ).flat();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          {/* 머리말 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-4">
              <Compass className="w-4 h-4" /> 여행 준비 가이드
            </div>
            <h1 className="text-[28px] sm:text-4xl font-bold text-gray-900 mb-3">떠나기 전, 이것만 챙기세요</h1>
            <p className="text-base sm:text-lg text-gray-600">공식 정보와 추천 영상으로 해외여행 준비를 한 번에</p>
          </div>

          <GuideTools />

          {/* 주제 바로가기 */}
          <nav className="flex flex-wrap gap-2 mt-10 mb-6">
            {GUIDE_TOPICS.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className="shrink-0 px-4 py-2.5 rounded-full bg-white border border-gray-200 text-[15px] font-semibold text-gray-700 hover:bg-gray-50"
              >
                {t.emoji} {t.title}
              </a>
            ))}
          </nav>

          {/* 주제별 */}
          <div className="space-y-8">
            {GUIDE_TOPICS.map((t) => (
              <section
                key={t.id}
                id={t.id}
                className="scroll-mt-24 rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-[0_12px_32px_-18px_rgba(30,41,59,0.35)]"
              >
                <div className={`bg-gradient-to-br ${t.gradient} p-6 text-white`}>
                  <div className="text-4xl mb-2">{t.emoji}</div>
                  <h2 className="text-2xl font-bold">{t.title}</h2>
                  <p className="text-base text-white/90 mt-1">{t.summary}</p>
                </div>

                <div className="p-5 sm:p-6 space-y-6">
                  <ul className="space-y-3">
                    {t.points.map((p, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-base text-gray-800 leading-relaxed">
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-2">
                    {t.links.map((l) =>
                      l.url.startsWith("/") ? (
                        <Link
                          key={l.url + l.label}
                          href={l.url}
                          className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-[15px] font-semibold"
                        >
                          {l.label}
                        </Link>
                      ) : (
                        <a
                          key={l.url + l.label}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-[15px] font-semibold"
                        >
                          {l.label} <ExternalLink className="w-4 h-4" />
                        </a>
                      )
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Youtube className="w-5 h-5 text-red-600" /> 추천 영상
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {t.videos.map((v) => (
                        <div key={v.id}>
                          <YouTubeEmbed id={v.id} title={v.title} />
                          <p className="mt-2 text-[15px] font-semibold text-gray-900 leading-snug line-clamp-2">{v.title}</p>
                          <p className="text-sm text-gray-500">
                            {v.channel === OWNER_CHANNEL.name && (
                              <span className="mr-1.5 inline-block px-2 py-0.5 rounded-full bg-red-600 text-white text-xs font-bold">운영자 추천</span>
                            )}
                            {v.channel}
                          </p>
                        </div>
                      ))}
                    </div>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(t.youtubeQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-red-600"
                    >
                      유튜브에서 더 찾아보기 <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {/* 주제에 맞는 쿠팡 파트너스 준비물 */}
                  {t.shopCategories && (
                    <AffiliateStrip
                      products={products.filter((p) => t.shopCategories!.includes(p.category)).slice(0, 10)}
                      title={t.id === "packing" ? "짐싸기 추천 준비물" : "함께 챙기면 좋은 준비물"}
                    />
                  )}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12">
            <FirstPostEventBanner href="/board/youtube/new" cta="내 유튜브 공유하기" />
          </div>

          {/* 커뮤니티 여행 유튜브 */}
          <section className="rounded-3xl p-6 border border-red-100 bg-gradient-to-br from-red-50 via-white to-rose-50">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Youtube className="w-7 h-7 text-red-600" /> 여행자들의 유튜브
                </h2>
                <p className="text-[15px] text-gray-600 mt-1">커뮤니티에 공유된 영상과 인기 여행 유튜버들의 영상이에요</p>
              </div>
              <Link
                href="/board/youtube/new"
                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-red-600 text-white text-[15px] font-bold"
              >
                <PenSquare className="w-4 h-4" /> 내 유튜브 공유하기
              </Link>
            </div>
            {community.length === 0 && (
              <p className="text-[15px] text-gray-600 mb-4">
                아직 공유된 영상이 없어요. 첫 번째로 내 여행 영상이나 채널을 소개해 주세요!
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {community.map((c) => (
                <Link key={c.id} href={`/board/youtube/${c.id}`} className="group min-w-0">
                  <VideoThumb id={c.videoId!} title={c.title} />
                  <p className="mt-2 text-[15px] font-semibold text-gray-900 line-clamp-2 group-hover:text-red-600">{c.title}</p>
                </Link>
              ))}
              {creatorVideos.map((v) => (
                <a
                  key={v.id}
                  href={youtubeWatchUrl(v.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group min-w-0"
                >
                  <VideoThumb id={v.id} title={v.title} />
                  <p className="mt-2 text-[15px] font-semibold text-gray-900 line-clamp-2 group-hover:text-red-600">{v.title}</p>
                  <p className="text-xs text-gray-500 truncate">{v.channel}</p>
                </a>
              ))}
            </div>
            <Link href="/board/youtube" className="mt-5 inline-block text-[15px] font-semibold text-red-600">
              여행 유튜브 게시판 전체 보기 →
            </Link>
          </section>

          <p className="mt-8 text-sm text-gray-400 text-center">
            수수료·요건은 바뀔 수 있어요. 출발 전 각 공식 사이트에서 최신 정보를 확인하세요.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function VideoThumb({ id, title }: { id: string; title: string }) {
  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={youtubeThumb(id)} alt={title} className="w-full h-full object-cover" loading="lazy" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="w-11 h-11 rounded-full bg-red-600/90 text-white flex items-center justify-center pl-0.5">▶</span>
      </span>
    </div>
  );
}
