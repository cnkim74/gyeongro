import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { title, content, category } = body;

  const supabase = getSupabaseServiceClient();
  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!post) return Response.json({ error: "게시글을 찾을 수 없어요." }, { status: 404 });

  const admin = await isAdmin(session.user.id);
  if (post.user_id !== session.user.id && !admin) {
    return Response.json({ error: "수정 권한이 없어요." }, { status: 403 });
  }

  const update: Record<string, string> = {};
  if (title?.trim()) update.title = title.trim();
  if (content?.trim()) update.content = content.trim();
  if (category) update.category = category;

  const { error } = await supabase.from("posts").update(update).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

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
  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!post) return Response.json({ error: "게시글을 찾을 수 없어요." }, { status: 404 });

  const admin = await isAdmin(session.user.id);
  if (post.user_id !== session.user.id && !admin) {
    return Response.json({ error: "삭제 권한이 없어요." }, { status: 403 });
  }

  const { error } = await supabase
    .from("posts")
    .update({ is_deleted: true })
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
