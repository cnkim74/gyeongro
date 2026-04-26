import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";
import Header from "@/components/Header";
import RoleBadge from "@/components/RoleBadge";
import { ArrowLeft, Eye, Calendar } from "lucide-react";
import PostActions from "./PostActions";
import CommentSection from "./CommentSection";
import type { UserRole } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { slug, postId } = await params;
  const supabase = getSupabaseServiceClient();

  const { data: board } = await supabase
    .from("boards")
    .select("id, slug, name, icon")
    .eq("slug", slug)
    .single();
  if (!board) notFound();

  await supabase
    .from("posts")
    .select("view_count")
    .eq("id", postId)
    .single()
    .then(async ({ data }) => {
      if (data) {
        await supabase
          .from("posts")
          .update({ view_count: data.view_count + 1 })
          .eq("id", postId);
      }
    });

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, content, board_id, view_count, created_at, user_id, is_deleted")
    .eq("id", postId)
    .single();

  if (!post || post.is_deleted) notFound();
  if (post.board_id !== board.id) notFound();

  const { data: author } = await supabase
    .schema("next_auth")
    .from("users")
    .select("name, image, custom_image, role, business_name")
    .eq("id", post.user_id)
    .single();

  const { data: comments } = await supabase
    .from("comments")
    .select("id, content, created_at, user_id, is_deleted")
    .eq("post_id", postId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  const commentUserIds = [...new Set((comments ?? []).map((c) => c.user_id))];
  const commentAuthors: Record<
    string,
    { name: string | null; image: string | null; role: UserRole }
  > = {};
  if (commentUserIds.length > 0) {
    const { data: users } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id, name, image, custom_image, role, business_name")
      .in("id", commentUserIds);
    for (const u of users ?? []) {
      const role: UserRole =
        u.role === "admin" || u.role === "business" || u.role === "user"
          ? u.role
          : "user";
      const displayName =
        role === "business" && u.business_name ? u.business_name : u.name;
      commentAuthors[u.id] = {
        name: displayName,
        image: u.custom_image ?? u.image,
        role,
      };
    }
  }

  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  const isCurrentUserAdmin = currentUserId ? await isAdmin(currentUserId) : false;
  const canEdit = currentUserId === post.user_id || isCurrentUserAdmin;

  const authorRole: UserRole =
    author?.role === "admin" || author?.role === "business" || author?.role === "user"
      ? author.role
      : "user";
  const authorName =
    authorRole === "business" && author?.business_name
      ? author.business_name
      : author?.name ?? "익명";
  const authorImage = author?.custom_image ?? author?.image ?? null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            href={`/board/${board.slug}`}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {board.icon ?? "📋"} {board.name}
          </Link>

          <article className="bg-white rounded-3xl border border-gray-100 p-8 mb-6">

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
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-900">{authorName}</p>
                    <RoleBadge role={authorRole} size="xs" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.created_at).toLocaleString("ko-KR")}
                    <Eye className="w-3 h-3 ml-2" />
                    {post.view_count}
                  </div>
                </div>
              </div>

              {canEdit && (
                <PostActions postId={post.id} boardSlug={board.slug} canEdit={canEdit} />
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
              author:
                commentAuthors[c.user_id] ?? { name: null, image: null, role: "user" as UserRole },
            }))}
            currentUserId={currentUserId}
            isAdmin={isCurrentUserAdmin}
          />
        </div>
      </main>
    </div>
  );
}
