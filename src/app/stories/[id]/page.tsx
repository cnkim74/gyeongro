import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import RoleBadge from "@/components/RoleBadge";
import { ArrowLeft, MapPin, Calendar, Eye } from "lucide-react";
import type { UserRole } from "@/lib/admin";
import StoryActions from "./StoryActions";
import LikeButton from "./LikeButton";

export const dynamic = "force-dynamic";

interface Section {
  title: string;
  image_url: string;
  content: string;
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

  const authorRole: UserRole =
    author?.role === "admin" || author?.role === "business" || author?.role === "user"
      ? author.role
      : "user";
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
            {sections.map((section, idx) => (
              <section key={idx}>
                {section.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={section.image_url}
                    alt={section.title}
                    className="w-full aspect-[16/9] object-cover rounded-3xl mb-6"
                  />
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
              </section>
            ))}
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
        </div>
      </main>
    </div>
  );
}
