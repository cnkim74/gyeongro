// 블로그 댓글 쓰기
// POST { postId, content, isPrivate?, parentId? } -> { id }
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { notifyBlogComment } from "@/lib/blog-comments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { postId?: string; content?: string; isPrivate?: boolean; parentId?: string | null };
  const postId = String(body.postId ?? "");
  const content = String(body.content ?? "").trim();
  if (!postId || !content) return Response.json({ error: "내용을 입력해 주세요." }, { status: 400 });
  if (content.length > 2000) return Response.json({ error: "2,000자 이내로 써 주세요." }, { status: 400 });

  const supabase = getSupabaseServiceClient();
  const admin = await isAdmin(userId);

  const { data: post } = await supabase.from("blog_posts").select("id, is_published").eq("id", postId).maybeSingle();
  if (!post || (!post.is_published && !admin)) return Response.json({ error: "글을 찾을 수 없어요." }, { status: 404 });

  // 도배 방지: 1분에 5개까지
  if (!admin) {
    const since = new Date(Date.now() - 60_000).toISOString();
    const { count } = await supabase
      .from("blog_comments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since);
    if ((count ?? 0) >= 5) return Response.json({ error: "잠시 후 다시 써 주세요." }, { status: 429 });
  }

  let isPrivate = body.isPrivate === true;
  let parentId: string | null = null;
  if (body.parentId) {
    const { data: parent } = await supabase
      .from("blog_comments")
      .select("id, post_id, parent_id, user_id, is_private, is_deleted")
      .eq("id", String(body.parentId))
      .maybeSingle();
    if (!parent || parent.post_id !== postId || parent.is_deleted) return Response.json({ error: "답글을 달 댓글이 없어요." }, { status: 404 });
    // 답글의 답글은 같은 댓글 아래로 (한 단계만)
    parentId = parent.parent_id ?? parent.id;
    if (parentId !== parent.id) {
      const { data: top } = await supabase.from("blog_comments").select("user_id, is_private").eq("id", parentId).maybeSingle();
      if (top) {
        parent.user_id = top.user_id;
        parent.is_private = top.is_private;
      }
    }
    if (parent.is_private) {
      // 비밀 댓글에는 쓴 사람과 관리자만 답글을 달 수 있고, 답글도 비밀
      if (!admin && parent.user_id !== userId) return Response.json({ error: "비밀 댓글에는 답글을 달 수 없어요." }, { status: 403 });
      isPrivate = true;
    }
  }

  const { data, error } = await supabase
    .from("blog_comments")
    .insert({ post_id: postId, parent_id: parentId, user_id: userId, content, is_private: isPrivate })
    .select("id")
    .single();
  if (error) {
    const missing = /blog_comments/.test(error.message);
    return Response.json(
      { error: missing ? "댓글 기능 준비 중이에요. (관리자: migration_blog_comments.sql 실행 필요)" : error.message },
      { status: 500 }
    );
  }
  // 응답을 먼저 보내고 알림은 뒤에서
  after(() => notifyBlogComment(data.id));
  return Response.json({ id: data.id });
}
