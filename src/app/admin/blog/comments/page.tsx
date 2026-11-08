// 블로그 댓글 모아 보기 (관리자) — 답을 안 한 댓글을 먼저, 알림 켜기
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import PushToggle from "@/components/PushToggle";

export const dynamic = "force-dynamic";
export const metadata = { title: "블로그 댓글 - Pothos" };

type Row = {
  id: string;
  post_id: string;
  parent_id: string | null;
  user_id: string;
  content: string;
  is_private: boolean;
  is_deleted: boolean;
  created_at: string;
};

export default async function AdminBlogCommentsPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const { all } = await searchParams;
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("blog_comments")
    .select("id, post_id, parent_id, user_id, content, is_private, is_deleted, created_at")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(300);
  const rows = (data ?? []) as Row[];

  // 관리자 목록 (답했는지 판단용)
  const { data: adminUsers } = await supabase.schema("next_auth").from("users").select("id").eq("role", "admin");
  const { data: adminRows } = await supabase.from("admins").select("user_id");
  const admins = new Set<string>([
    ...((adminUsers ?? []) as { id: string }[]).map((u) => u.id),
    ...((adminRows ?? []) as { user_id: string }[]).map((a) => a.user_id),
  ]);

  const postIds = [...new Set(rows.map((r) => r.post_id))];
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const [{ data: posts }, { data: users }] = await Promise.all([
    postIds.length ? supabase.from("blog_posts").select("id, slug, title").in("id", postIds) : Promise.resolve({ data: [] }),
    userIds.length
      ? supabase.schema("next_auth").from("users").select("id, nickname, name, email").in("id", userIds)
      : Promise.resolve({ data: [] }),
  ]);
  const postOf = new Map(((posts ?? []) as { id: string; slug: string; title: string }[]).map((p) => [p.id, p]));
  const userOf = new Map(
    ((users ?? []) as { id: string; nickname?: string | null; name?: string | null; email?: string | null }[]).map((u) => [u.id, u])
  );

  // 손님이 쓴 댓글(관리자 것 제외) + 관리자가 답했는지
  const tops = rows.filter((r) => !r.parent_id && !admins.has(r.user_id));
  const answered = (id: string) => rows.some((r) => r.parent_id === id && admins.has(r.user_id));
  const list = all ? tops : tops.filter((t) => !answered(t.id));
  const waiting = tops.filter((t) => !answered(t.id)).length;
  // 손님이 남긴 답글(대화가 이어진 것)
  const guestReplies = rows.filter((r) => r.parent_id && !admins.has(r.user_id)).slice(0, 20);

  return (
    <div className="p-5 sm:p-8 max-w-4xl">
      <Link href="/admin/blog" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="w-4 h-4" /> 블로그 관리
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold text-gray-900">💬 블로그 댓글</h1>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
        <p className="font-bold text-gray-900">새 댓글이 달리면 바로 알림 받기</p>
        <p className="mt-1 text-sm text-gray-600 leading-relaxed">
          이 기기(브라우저)에서 알림을 켜 두면 새 댓글·비밀 댓글이 달릴 때 푸시 알림이 와요. 휴대폰·PC 각각 켜 주세요.
          알림을 켠 기기가 없으면 로그인 이메일로 알려 드려요.
        </p>
        <div className="mt-3">
          <PushToggle label="새 댓글 알림" />
        </div>
      </div>

      {error ? (
        <p className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          아직 댓글 테이블이 없어요. Supabase SQL Editor 에서 <b>supabase/migration_blog_comments.sql</b> 을 실행해 주세요.
        </p>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Link
              href="/admin/blog/comments"
              className={`px-3.5 py-1.5 rounded-full text-sm font-bold ${!all ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              답변 기다리는 댓글 {waiting}
            </Link>
            <Link
              href="/admin/blog/comments?all=1"
              className={`px-3.5 py-1.5 rounded-full text-sm font-bold ${all ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              전체 {tops.length}
            </Link>
          </div>

          {list.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">{all ? "아직 댓글이 없어요." : "답변을 기다리는 댓글이 없어요. 👍"}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {list.map((c) => {
                const p = postOf.get(c.post_id);
                const u = userOf.get(c.user_id);
                return (
                  <li key={c.id} className="rounded-2xl border border-gray-100 bg-white p-4">
                    <p className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                      <b className="text-gray-800">{u?.nickname || u?.name || "여행자"}</b>
                      {u?.email && <span>{u.email}</span>}
                      {c.is_private && (
                        <span className="inline-flex items-center gap-0.5 text-amber-700 font-bold">
                          <Lock className="w-3 h-3" /> 비밀
                        </span>
                      )}
                      <span>{new Date(c.created_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}</span>
                      {answered(c.id) && <span className="text-emerald-600 font-bold">답변함</span>}
                    </p>
                    <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap break-words">{c.content}</p>
                    {p && (
                      <Link href={`/blog/${p.slug}#c-${c.id}`} className="mt-2 inline-block text-xs font-bold text-blue-600">
                        &lsquo;{p.title}&rsquo; 에서 답하기 →
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {guestReplies.length > 0 && (
            <>
              <h2 className="mt-10 text-lg font-extrabold text-gray-900">최근 이어진 대화 (손님 답글)</h2>
              <ul className="mt-3 space-y-2">
                {guestReplies.map((c) => {
                  const p = postOf.get(c.post_id);
                  const u = userOf.get(c.user_id);
                  return (
                    <li key={c.id} className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
                      <span className="font-bold text-gray-800">{u?.nickname || u?.name || "여행자"}</span>
                      {c.is_private && <Lock className="inline w-3 h-3 ml-1 text-amber-700" />}
                      <span className="text-gray-600"> — {c.content.slice(0, 120)}</span>
                      {p && (
                        <Link href={`/blog/${p.slug}#c-${c.parent_id}`} className="ml-2 text-xs font-bold text-blue-600">
                          보기 →
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
