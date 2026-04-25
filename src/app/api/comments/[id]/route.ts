import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServiceClient();
  const { data: comment } = await supabase
    .from("comments")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!comment) {
    return Response.json({ error: "댓글을 찾을 수 없어요." }, { status: 404 });
  }

  const admin = await isAdmin(session.user.id);
  if (comment.user_id !== session.user.id && !admin) {
    return Response.json({ error: "삭제 권한이 없어요." }, { status: 403 });
  }

  const { error } = await supabase
    .from("comments")
    .update({ is_deleted: true })
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
