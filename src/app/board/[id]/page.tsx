import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";
import Header from "@/components/Header";
import { ArrowLeft, Eye, Calendar } from "lucide-react";
import PostActions from "./PostActions";
import CommentSection from "./CommentSection";

export const dynamic = "force-dynamic";

const CATEGORIES: Record<string, string> = {
  free: "💬 자유",
  tip: "💡 여행 팁",
  question: "❓ 질문",
  review: "⭐ 후기",
};

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseServiceClient();

  await supabase.rpc("increment_view_count", { post_id: id }).then(() => {});
  // 위 RPC가 없으면 무시. 아래 update로 대체:
  await supabase
    .from("posts")
    .select("view_count")
    .eq("id", id)
    .single()
    .then(async ({ data }) => {
      if (data) {
        await supabase
          .from("posts")
          .update({ view_count: data.view_count + 1 })
          .eq("id", id);
      }
    });

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, content, category, view_count, created_at, user_id, is_deleted")
    .eq("id", id)
    .single();

  if (!post || post.is_deleted) notFound();

  const { data: author } = await supabase
    .schema("next_auth")
    .from("users")
    .select("name, image, custom_image")
    .eq("id", post.user_id)
    .single();

  const { data: comments } = await supabase
    .from("comments")
    .select("id, content, created_at, user_id, is_deleted")
    .eq("post_id", id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  const commentUserIds = [...new Set((comments ?? []).map((c) => c.user_id))];
  const commentAuthors: Record<
    string,
    { name: string | null; image: string | null }
  > = {};
  if (commentUserIds.length > 0) {
    const { data: users } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id, name, image, custom_image")
      .in("id", commentUserIds);
    for (const u of users ?? []) {
      commentAuthors[u.id] = { name: u.name, image: u.custom_image ?? u.image };
    }
  }

  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  const isCurrentUserAdmin = currentUserId ? await isAdmin(currentUserId) : false;
  const canEdit = currentUserId === post.user_id || isCurrentUserAdmin;

  const authorName = author?.name ?? "익명";
  const authorImage = author?.custom_image ?? author?.image ?? null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            href="/board"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            목록으로
          </Link>

          <article className="bg-white rounded-3xl border border-gray-100 p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-medium">
                {CATEGORIES[post.category] ?? post.category}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 break-words">
              {post.title}
            </h1>

            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {authorImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={authorImage}
                    alt={authorName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    {authorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900">{authorName}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.created_at).toLocaleString("ko-KR")}
                    <Eye className="w-3 h-3 ml-2" />
                    {post.view_count}
                  </div>
                </div>
              </div>

              {canEdit && (
                <PostActions postId={post.id} canEdit={canEdit} />
              )}
            </div>

            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
              {post.content}
            </div>
          </article>

          <CommentSection
            postId={post.id}
            comments={(comments ?? []).map((c) => ({
              id: c.id,
              content: c.content,
              created_at: c.created_at,
              user_id: c.user_id,
              author: commentAuthors[c.user_id] ?? { name: null, image: null },
            }))}
            currentUserId={currentUserId}
            isAdmin={isCurrentUserAdmin}
          />
        </div>
      </main>
    </div>
  );
}
