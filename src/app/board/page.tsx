import Link from "next/link";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MessageSquare, Pin, Sparkles, Eye, MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "커뮤니티 - 경로",
};

const CATEGORIES = [
  { id: "all", label: "전체", emoji: "📋" },
  { id: "free", label: "자유", emoji: "💬" },
  { id: "tip", label: "여행 팁", emoji: "💡" },
  { id: "question", label: "질문", emoji: "❓" },
  { id: "review", label: "후기", emoji: "⭐" },
];

interface PostRow {
  id: string;
  title: string;
  category: string;
  view_count: number;
  is_pinned: boolean;
  created_at: string;
  user_id: string;
}

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { category = "all", page: pageStr = "1" } = await searchParams;
  const page = parseInt(pageStr, 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  const supabase = getSupabaseServiceClient();
  let query = supabase
    .from("posts")
    .select("id, title, category, view_count, is_pinned, created_at, user_id", {
      count: "exact",
    })
    .eq("is_deleted", false)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category !== "all") query = query.eq("category", category);

  const { data: posts, count } = await query;

  const userIds = [...new Set((posts ?? []).map((p) => p.user_id))];
  const usersMap: Record<string, { name: string | null; image: string | null }> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id, name, image, custom_image")
      .in("id", userIds);
    for (const u of users ?? []) {
      usersMap[u.id] = { name: u.name, image: u.custom_image ?? u.image };
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-7 h-7 text-blue-500" />
                커뮤니티
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                여행 정보를 공유하고 다른 여행자들과 소통하세요
              </p>
            </div>
            <Link
              href="/board/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              글쓰기
            </Link>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c.id}
                href={`/board${c.id === "all" ? "" : `?category=${c.id}`}`}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  category === c.id
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {c.emoji} {c.label}
              </Link>
            ))}
          </div>

          {!posts || posts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">아직 게시글이 없어요. 첫 글을 작성해보세요!</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
              {(posts as PostRow[]).map((post, idx) => {
                const author = usersMap[post.user_id];
                const cat = CATEGORIES.find((c) => c.id === post.category);
                return (
                  <Link
                    key={post.id}
                    href={`/board/${post.id}`}
                    className={`flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors ${
                      idx > 0 ? "border-t border-gray-100" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {post.is_pinned && (
                          <Pin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium shrink-0">
                          {cat?.label ?? post.category}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                        <span>{author?.name ?? "익명"}</span>
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
                  href={`/board?${
                    category !== "all" ? `category=${category}&` : ""
                  }page=${p}`}
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
