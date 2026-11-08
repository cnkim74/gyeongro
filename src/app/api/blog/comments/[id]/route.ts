// 블로그 댓글 지우기 (쓴 사람 또는 관리자) — 기록은 남기고 내용만 숨김
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  const { id } = await params;
  const supabase = getSupabaseServiceClient();
  const { data: c } = await supabase.from("blog_comments").select("user_id").eq("id", id).maybeSingle();
  if (!c) return Response.json({ error: "댓글이 없어요." }, { status: 404 });
  if (c.user_id !== userId && !(await isAdmin(userId))) return Response.json({ error: "권한이 없어요." }, { status: 403 });
  const { error } = await supabase.from("blog_comments").update({ is_deleted: true }).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
