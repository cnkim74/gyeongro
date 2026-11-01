// 메인 '여행 영감' — 블로그·스토리 읽을거리와 여행 유튜브를 방문할 때마다 랜덤으로 보여줌
// (찾아 들어가기 어려운 콘텐츠를 메인에서 바로 만나도록)

import Link from "next/link";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { FEATURED_CREATORS, OWNER_CHANNEL } from "@/lib/travel-guide";
import { extractYouTube } from "@/lib/youtube";
import BlogCover from "@/components/blog/BlogCover";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { ArrowRight, BookOpen, ChevronRight } from "lucide-react";

type Read = { key: string; href: string; title: string; label: string; image: string | null; coverStyle?: string | null; category?: string };
type Video = { id: string; title: string; channel: string };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function getContent(): Promise<{ reads: Read[]; videos: Video[] }> {
  const supabase = getSupabaseServiceClient();
  const [blogRes, storyRes, ytBoard] = await Promise.all([
    supabase.from("blog_posts").select("*").eq("is_published", true).order("published_at", { ascending: false }).limit(15),
    supabase
      .from("stories")
      .select("id, title, cover_image_url, destination")
      .eq("is_published", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("boards").select("id").eq("slug", "youtube").maybeSingle(),
  ]);

  const blogs: Read[] = (blogRes.error ? [] : blogRes.data ?? []).map((b) => ({
    key: `b-${b.id}`,
    href: `/blog/${b.slug}`,
    title: b.title,
    label: "블로그",
    image: b.cover_image_url,
    coverStyle: b.cover_style ?? null,
    category: b.category,
  }));
  const stories: Read[] = (storyRes.data ?? []).map((s) => ({
    key: `s-${s.id}`,
    href: `/stories/${s.id}`,
    title: s.title,
    label: "스토리",
    image: s.cover_image_url,
    category: s.destination ?? undefined,
  }));
  // 블로그를 우선 섞되 스토리도 함께
  const reads = shuffle([...shuffle(blogs).slice(0, 4), ...shuffle(stories).slice(0, 2)]).slice(0, 3);

  let community: Video[] = [];
  if (ytBoard.data) {
    const { data } = await supabase
      .from("posts")
      .select("title, content")
      .eq("board_id", ytBoard.data.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(10);
    community = (data ?? [])
      .map((p) => ({ id: extractYouTube(String(p.content ?? "")).videoIds[0], title: String(p.title), channel: "커뮤니티 공유" }))
      .filter((v) => v.id);
  }
  const creators: Video[] = FEATURED_CREATORS.flatMap((c) => c.videos.map((v) => ({ ...v, channel: c.name })));
  const owner: Video[] = OWNER_CHANNEL.videos.map((v) => ({ id: v.id, title: v.title, channel: OWNER_CHANNEL.name }));
  // 운영자 영상 1편은 항상 포함 + 나머지 랜덤
  const seen = new Set<string>();
  const videos = [...shuffle(owner).slice(0, 1), ...shuffle([...creators, ...community])]
    .filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)))
    .slice(0, 4);
  return { reads: shuffle(reads), videos: shuffle(videos) };
}

export default async function HomeInspiration() {
  let content: { reads: Read[]; videos: Video[] };
  try {
    content = await getContent();
  } catch {
    return null;
  }
  const { reads, videos } = content;
  if (reads.length === 0 && videos.length === 0) return null;

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-sm font-semibold text-blue-600 mb-2 tracking-wide">TRAVEL INSPIRATION</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">떠나기 전, 읽고 보는 여행</h2>
            <p className="text-slate-500 mt-2">올 때마다 새로운 글과 영상을 골라 보여드려요</p>
          </div>
        </div>

        {reads.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <BookOpen className="w-5 h-5 text-blue-600" /> 읽을거리
              </h3>
              <div className="flex gap-4 text-sm font-semibold text-slate-500">
                <Link href="/blog" className="inline-flex items-center hover:text-blue-600">
                  블로그 <ChevronRight className="w-4 h-4" />
                </Link>
                <Link href="/stories" className="inline-flex items-center hover:text-blue-600">
                  스토리 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-5 mb-14">
              {reads.map((r) => (
                <Link key={r.key} href={r.href} className="group min-w-0">
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-200 shadow-sm group-hover:shadow-lg transition-shadow">
                    <div className="w-full h-full group-hover:scale-[1.03] transition-transform duration-300">
                      <BlogCover title={r.title} category={r.category} image={r.image} coverStyle={r.coverStyle} />
                    </div>
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/55 text-white text-[11px] font-bold backdrop-blur">
                      {r.label}
                    </span>
                  </div>
                  <p className="mt-3 font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600">{r.title}</p>
                </Link>
              ))}
            </div>
          </>
        )}

        {videos.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <span className="text-red-600">▶</span> 여행 유튜브
              </h3>
              <Link href="/travel-guide" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600">
                더 보기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {videos.map((v) => (
                <div key={v.id} className="min-w-0">
                  <YouTubeEmbed id={v.id} title={v.title} />
                  <p className="mt-2 text-sm font-semibold text-slate-900 leading-snug line-clamp-2">{v.title}</p>
                  <p className="text-xs text-slate-500 truncate">{v.channel}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-10 text-center">
          <Link href="/planner" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800">
            마음에 드는 곳, 바로 일정 만들기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
