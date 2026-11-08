// 댓글 쓰기·지우기 API 공용 처리 (블로그 · 스토리)
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { COMMENT_TABLE, commentTarget, notifyComment, type CommentKind } from "@/lib/blog-comments";

const MIGRATION: Record<CommentKind, string> = {
  blog: "migration_blog_comments.sql",
  story: "migration_story_comments.sql",
};

/** POST { postId, content, isPrivate?, parentId? } -> { id } */
export async function handleCommentPost(kind: CommentKind, req: Request): Promise<Response> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { postId?: string; content?: string; isPrivate?: boolean; parentId?: string | null };
  const postId = String(body.postId ?? "");
  const content = String(body.content ?? "").trim();
  if (!postId || !content) return Response.json({ error: "내용을 입력해 주세요." }, { status: 400 });
  if (content.length > 2000) return Response.json({ error: "2,000자 이내로 써 주세요." }, { status: 400 });

  const supabase = getSupabaseServiceClient();
  const table = COMMENT_TABLE[kind];
  const admin = await isAdmin(userId);
  const target = await commentTarget(kind, postId);
  const owner = !!target && target.ownerIds.includes(userId);
  if (!target || (!target.visible && !admin && !owner)) return Response.json({ error: "글을 찾을 수 없어요." }, { status: 404 });

  // 도배 방지: 1분에 5개까지
  if (!admin) {
    const since = new Date(Date.now() - 60_000).toISOString();
    const { count } = await supabase.from(table).select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since);
    if ((count ?? 0) >= 5) return Response.json({ error: "잠시 후 다시 써 주세요." }, { status: 429 });
  }

  let isPrivate = body.isPrivate === true;
  let parentId: string | null = null;
  if (body.parentId) {
    const { data: parent } = await supabase
      .from(table)
      .select("id, post_id, parent_id, user_id, is_private, is_deleted")
      .eq("id", String(body.parentId))
      .maybeSingle();
    if (!parent || parent.post_id !== postId || parent.is_deleted) return Response.json({ error: "답글을 달 댓글이 없어요." }, { status: 404 });
    // 답글의 답글은 같은 댓글 아래로 (한 단계만)
    parentId = parent.parent_id ?? parent.id;
    if (parentId !== parent.id) {
      const { data: top } = await supabase.from(table).select("user_id, is_private").eq("id", parentId).maybeSingle();
      if (top) {
        parent.user_id = top.user_id;
        parent.is_private = top.is_private;
      }
    }
    if (parent.is_private) {
      // 비밀 댓글에는 쓴 사람·글쓴이·관리자만 답글을 달 수 있고, 답글도 비밀
      if (!admin && !owner && parent.user_id !== userId) return Response.json({ error: "비밀 댓글에는 답글을 달 수 없어요." }, { status: 403 });
      isPrivate = true;
    }
  }

  const { data, error } = await supabase
    .from(table)
    .insert({ post_id: postId, parent_id: parentId, user_id: userId, content, is_private: isPrivate })
    .select("id")
    .single();
  if (error) {
    const missing = error.message.includes(table);
    return Response.json(
      { error: missing ? `댓글 기능 준비 중이에요. (관리자: ${MIGRATION[kind]} 실행 필요)` : error.message },
      { status: 500 }
    );
  }
  // 응답을 먼저 보내고 알림은 뒤에서
  after(() => notifyComment(kind, data.id));
  return Response.json({ id: data.id });
}

/** 지우기 (쓴 사람 · 글쓴이 · 관리자) — 기록은 남기고 내용만 숨김 */
export async function handleCommentDelete(kind: CommentKind, id: string): Promise<Response> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  const supabase = getSupabaseServiceClient();
  const table = COMMENT_TABLE[kind];
  const { data: c } = await supabase.from(table).select("user_id, post_id").eq("id", id).maybeSingle();
  if (!c) return Response.json({ error: "댓글이 없어요." }, { status: 404 });
  let allowed = c.user_id === userId || (await isAdmin(userId));
  if (!allowed) {
    const target = await commentTarget(kind, c.post_id);
    allowed = !!target && target.ownerIds.includes(userId);
  }
  if (!allowed) return Response.json({ error: "권한이 없어요." }, { status: 403 });
  const { error } = await supabase.from(table).update({ is_deleted: true }).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
