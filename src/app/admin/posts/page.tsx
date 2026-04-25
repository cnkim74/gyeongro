import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import { ArrowLeft, Pin, Eye } from "lucide-react";
import AdminPostActions from "./AdminPostActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "게시글 관리 - 경로",
};

const CATEGORIES: Record<string, string> = {
  free: "자유",
  tip: "팁",
  question: "질문",
  review: "후기",
};

export default async function AdminPostsPage() {
  const session = await requireAdmin();
  if (!session) redirect("/");

  const supabase = getSupabaseServiceClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, category, view_count, is_pinned, is_deleted, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(100);

  const userIds = [...new Set((posts ?? []).map((p) => p.user_id))];
  const usersMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id, name, email")
      .in("id", userIds);
    for (const u of users ?? []) {
      usersMap[u.id] = u.name ?? u.email ?? "익명";
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            대시보드로
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">게시글 관리</h1>
          <p className="text-gray-500 text-sm mb-6">최근 100개 게시글</p>

          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">상태</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">제목</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">카테고리</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">작성자</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">조회</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">작성일</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-600">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {(posts ?? []).map((p) => (
                    <tr
                      key={p.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        p.is_deleted ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-5 py-3">
                        {p.is_deleted ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">
                            삭제됨
                          </span>
                        ) : p.is_pinned ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-medium">
                            <Pin className="w-3 h-3" />
                            고정
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/board/${p.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {p.title}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {CATEGORIES[p.category] ?? p.category}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {usersMap[p.user_id] ?? "-"}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {p.view_count}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(p.created_at).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <AdminPostActions
                          postId={p.id}
                          isPinned={p.is_pinned}
                          isDeleted={p.is_deleted}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
