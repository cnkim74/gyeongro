// 게시판 댓글 지우기 — 쓴 회원·관리자, 비회원은 같은 브라우저이거나 비밀번호가 맞으면
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";
import { guestCanDelete } from "@/lib/guest-comment";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  const supabase = getSupabaseServiceClient();
  const { data: comment } = await supabase.from("comments").select("*").eq("id", id).maybeSingle();
  if (!comment) return Response.json({ error: "댓글을 찾을 수 없어요." }, { status: 404 });

  let allowed = false;
  if (!comment.user_id && (await guestCanDelete(comment, body.password))) allowed = true;
  if (!allowed && userId) allowed = comment.user_id === userId || (await isAdmin(userId));
  if (!allowed) {
    if (!userId && comment.user_id) return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
    return Response.json({ error: comment.user_id ? "삭제 권한이 없어요." : "비밀번호가 맞지 않아요." }, { status: 403 });
  }

  const { error } = await supabase.from("comments").update({ is_deleted: true }).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
