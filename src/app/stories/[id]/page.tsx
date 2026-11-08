import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdmin, parseRole } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import RoleBadge from "@/components/RoleBadge";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { extractYouTube } from "@/lib/youtube";
import { ArrowLeft, MapPin, Calendar, Eye, ExternalLink, Camera } from "lucide-react";
import StoryActions from "./StoryActions";
import LikeButton from "./LikeButton";
import BlogComments from "@/components/blog/BlogComments";
import { listComments, countVisible } from "@/lib/blog-comments";

export const dynamic = "force-dynamic";

/** 스토리마다 검색·공유용 제목·설명·이미지 (없으면 모든 스토리가 같은 제목으로 보임) */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data: s } = await getSupabaseServiceClient()
    .from("stories")
    .select("title, subtitle, intro, destination, cover_image_url, is_published, is_deleted")
    .eq("id", id)
    .maybeSingle();
  if (!s || s.is_deleted || !s.is_published) return { title: "여행 스토리 - Pothos" };
  const title = String(s.title).replace(/^\[Pothos 에디터\]\s*/, "");
  const description = String(s.subtitle || s.intro || `${s.destination ?? ""} 여행 이야기`).replace(/\s+/g, " ").slice(0, 150);
  const images = s.cover_image_url ? [s.cover_image_url] : ["/og-default.jpg"];
  return {
    title: `${title} | Pothos 여행 스토리`,
    description,
    alternates: { canonical: `/stories/${id}` },
    openGraph: { type: "article", title, description, url: `/stories/${id}`, images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

interface Section {
  title: string;
  image_url: string;
  content: string;
  image_credit?: string;
  image_credit_url?: string;
  videos?: { url: string; title?: string }[];
  links?: { label?: string; url: string }[];
}

/** https 주소만 링크로 허용 (사용자 입력 보호) */
function safeUrl(v: unknown): string | null {
  return typeof v === "string" && /^https:\/\/[^\s]+$/.test(v.trim()) ? v.trim() : null;
}

function sectionVideos(section: Section) {
  if (!Array.isArray(section.videos)) return [];
  return section.videos
    .map((v) => {
      const id = typeof v?.url === "string" ? extractYouTube(v.url).videoIds[0] : undefined;
      return id ? { id, title: typeof v.title === "string" ? v.title.slice(0, 120) : "" } : null;
    })
    .filter((v): v is { id: string; title: string } => !!v)
    .slice(0, 4);
}

function sectionLinks(section: Section) {
  if (!Array.isArray(section.links)) return [];
  return section.links
    .map((l) => {
      const url = safeUrl(l?.url);
      return url ? { url, label: typeof l.label === "string" && l.label.trim() ? l.label.slice(0, 120) : url } : null;
    })
    .filter((l): l is { url: string; label: string } => !!l)
    .slice(0, 12);
}

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseServiceClient();

  await supabase
    .from("stories")
    .select("view_count")
    .eq("id", id)
    .single()
    .then(async ({ data }) => {
      if (data) {
        await supabase
          .from("stories")
          .update({ view_count: (data.view_count ?? 0) + 1 })
          .eq("id", id);
      }
    });

  const { data: story } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  if (!story || story.is_deleted || !story.is_published) notFound();

  const { data: author } = await supabase
    .schema("next_auth")
    .from("users")
    .select("name, image, custom_image, role")
    .eq("id", story.user_id)
    .single();

  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  const adminFlag = currentUserId ? await isAdmin(currentUserId) : false;
  const canEdit = currentUserId === story.user_id || adminFlag;

  let liked = false;
  if (currentUserId) {
    const { data: like } = await supabase
      .from("story_likes")
      .select("id")
      .eq("story_id", id)
      .eq("user_id", currentUserId)
      .maybeSingle();
    liked = !!like;
  }

  // 댓글 (공개 / 비밀) — 글쓴이는 스토리를 쓴 회원
  const comments = await listComments("story", story.id, currentUserId, adminFlag, [story.user_id]);

  const authorRole = parseRole(author?.role);
  const authorName = author?.name ?? "익명";
  const authorImage = author?.custom_image ?? author?.image ?? null;
  const sections: Section[] = (story.sections ?? []) as Section[];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      {/* Cover */}
      {story.cover_image_url && (
        <div className="relative h-[60vh] min-h-[400px] mt-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={story.cover_image_url}
            alt={story.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 text-white">
            <div className="max-w-3xl mx-auto">
              {story.destination && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full mb-4">
                  <MapPin className="w-3.5 h-3.5" />
                  {story.destination}
                </span>
              )}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-3">
                {story.title}
              </h1>
              {story.subtitle && (
                <p className="text-lg sm:text-xl text-white/80">{story.subtitle}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <main className={`flex-1 ${story.cover_image_url ? "" : "pt-24"} pb-16`}>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <Link
            href="/stories"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> 스토리 목록
          </Link>

          {!story.cover_image_url && (
            <>
              {story.destination && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-4">
                  <MapPin className="w-3.5 h-3.5" />
                  {story.destination}
                </span>
              )}
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3 text-slate-900">
                {story.title}
              </h1>
              {story.subtitle && (
                <p className="text-lg text-slate-500 mb-6">{story.subtitle}</p>
              )}
            </>
          )}

          {/* 메타 */}
          <div className="flex items-center justify-between mb-10 pb-8 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {authorImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={authorImage}
                  alt={authorName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {authorName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-slate-900">{authorName}</p>
                  <RoleBadge role={authorRole} size="xs" />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(story.created_at).toLocaleDateString("ko-KR")}
                  </span>
                  <span>·</span>
                  {story.duration_text && (
                    <>
                      <span>{story.duration_text}</span>
                      <span>·</span>
                    </>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {story.view_count}
                  </span>
                </div>
              </div>
            </div>
            {canEdit && <StoryActions storyId={story.id} />}
          </div>

          {/* 서문 */}
          {story.intro && (
            <div className="text-lg text-slate-700 leading-relaxed mb-12 italic border-l-4 border-blue-500 pl-6 py-2">
              {story.intro}
            </div>
          )}

          {/* 챕터들 */}
          <article className="space-y-12 mb-12">
            {sections.map((section, idx) => {
              const videos = sectionVideos(section);
              const links = sectionLinks(section);
              const creditUrl = safeUrl(section.image_credit_url);
              return (
                <section key={idx}>
                  {section.image_url && (
                    <figure className="mb-6">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={section.image_url}
                        alt={section.title}
                        loading="lazy"
                        className="w-full aspect-[16/9] object-cover rounded-3xl"
                      />
                      {section.image_credit && (
                        <figcaption className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                          <Camera className="w-3 h-3 shrink-0" />
                          {creditUrl ? (
                            <a href={creditUrl} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                              사진: {section.image_credit}
                            </a>
                          ) : (
                            <span className="truncate">사진: {section.image_credit}</span>
                          )}
                        </figcaption>
                      )}
                    </figure>
                  )}
                  {section.title && (
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-4">
                      {section.title}
                    </h2>
                  )}
                  {section.content && (
                    <div className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </div>
                  )}
                  {videos.length > 0 && (
                    <div className={`mt-6 grid gap-4 ${videos.length > 1 ? "sm:grid-cols-2" : ""}`}>
                      {videos.map((v) => (
                        <div key={v.id} className="min-w-0">
                          <YouTubeEmbed id={v.id} title={v.title} />
                          {v.title && <p className="mt-2 text-sm text-slate-500 line-clamp-2">▶ {v.title}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {links.length > 0 && (
                    <ul className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 divide-y divide-slate-200 overflow-hidden">
                      {links.map((l) => (
                        <li key={l.url + l.label}>
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-white hover:text-blue-600 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 shrink-0 text-slate-400" />
                            <span className="min-w-0 truncate">{l.label}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </article>

          {/* 태그 */}
          {story.tags && story.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-8 border-t border-slate-100 mb-8">
              {story.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 좋아요 */}
          <div className="flex justify-center mt-12">
            <LikeButton
              storyId={story.id}
              initialLiked={liked}
              initialCount={story.like_count ?? 0}
              loggedIn={!!currentUserId}
            />
          </div>

          <BlogComments
            kind="story"
            postId={story.id}
            path={`/stories/${story.id}`}
            comments={comments}
            total={comments ? countVisible(comments) : 0}
            viewerId={currentUserId}
            isAdmin={adminFlag}
            isOwner={currentUserId === story.user_id}
          />
        </div>
      </main>
    </div>
  );
}
