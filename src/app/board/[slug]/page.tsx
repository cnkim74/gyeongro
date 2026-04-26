import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RoleBadge from "@/components/RoleBadge";
import {
  ArrowLeft,
  Pin,
  Sparkles,
  Eye,
  MessageCircle,
} from "lucide-react";
import type { UserRole } from "@/lib/admin";

export const dynamic = "force-dynamic";

interface PostRow {
  id: string;
  title: string;
  view_count: number;
  is_pinned: boolean;
  created_at: string;
  user_id: string;
}

export default async function BoardPostsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageStr = "1" } = await searchParams;
  const page = parseInt(pageStr, 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  const supabase = getSupabaseServiceClient();
  const { data: board } = await supabase
    .from("boards")
    .select("id, slug, name, description, icon, is_admin_only, is_published")
    .eq("slug", slug)
    .single();

  if (!board || !board.is_published) notFound();

  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  const adminFlag = currentUserId ? await isAdmin(currentUserId) : false;

  const canWrite = !board.is_admin_only || adminFlag;

  const { data: posts, count } = await supabase
    .from("posts")
    .select("id, title, view_count, is_pinned, created_at, user_id", {
      count: "exact",
    })
    .eq("board_id", board.id)
    .eq("is_deleted", false)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const userIds = [...new Set((posts ?? []).map((p) => p.user_id))];
  const usersMap: Record<
    string,
    { name: string | null; image: string | null; role: UserRole }
  > = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id, name, image, custom_image, role, business_name")
      .in("id", userIds);
    for (const u of users ?? []) {
      const role: UserRole =
        u.role === "admin" || u.role === "business" || u.role === "user"
          ? u.role
          : "user";
      const displayName =
        role === "business" && u.business_name ? u.business_name : u.name;
      usersMap[u.id] = {
        name: displayName,
        image: u.custom_image ?? u.image,
        role,
      };
    }
  }

  const postIds = (posts ?? []).map((p) => p.id);
  const commentCounts: Record<string, number> = {};
  if (postIds.length > 0) {
    const { data: comments } = await supabase
      .from("comments")
      .select("post_id")
      .in("post_id", postIds)
      .eq("is_deleted", false);
    for (const c of comments ?? []) {
      commentCounts[c.post_id] = (commentCounts[c.post_id] ?? 0) + 1;
    }
  }

  const totalPages = Math.ceil((count ?? 0) / limit);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <Link
            href="/board"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            게시판 목록
          </Link>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-3xl">{board.icon ?? "📋"}</span>
                {board.name}
              </h1>
              {board.description && (
                <p className="text-gray-500 text-sm mt-1">{board.description}</p>
              )}
            </div>
            {canWrite && (
              <Link
                href={`/board/${board.slug}/new`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                글쓰기
              </Link>
            )}
          </div>

          {!posts || posts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
              <p className="text-gray-500">아직 게시글이 없어요. 첫 글을 작성해보세요!</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
              {(posts as PostRow[]).map((post, idx) => {
                const author = usersMap[post.user_id];
                return (
                  <Link
                    key={post.id}
                    href={`/board/${board.slug}/${post.id}`}
                    className={`flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors ${
                      idx > 0 ? "border-t border-gray-100" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      {post.is_pinned && (
                        <div className="flex items-center gap-1 mb-1">
                          <Pin className="w-3.5 h-3.5 text-orange-500" />
                          <span className="text-xs text-orange-600 font-semibold">고정</span>
                        </div>
                      )}
                      <h3 className="font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          {author?.name ?? "익명"}
                          {author?.role && <RoleBadge role={author.role} size="xs" />}
                        </span>
                        <span>·</span>
                        <span>
                          {new Date(post.created_at).toLocaleDateString("ko-KR", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.view_count}
                        </span>
                        {(commentCounts[post.id] ?? 0) > 0 && (
                          <span className="flex items-center gap-1 text-blue-500">
                            <MessageCircle className="w-3 h-3" />
                            {commentCounts[post.id]}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-1 mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/board/${board.slug}?page=${p}`}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
