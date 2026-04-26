import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";

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

  const supabase = getSupabaseServiceClient();
  const { data: post } = await supabase
    .from("partner_posts")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!post) return Response.json({ error: "찾을 수 없어요." }, { status: 404 });

  const adminFlag = await isAdmin(session.user.id);
  if (post.user_id !== session.user.id && !adminFlag) {
    return Response.json({ error: "권한이 없어요." }, { status: 403 });
  }

  const update: Record<string, unknown> = {};
  for (const key of [
    "title",
    "description",
    "destination",
    "start_date",
    "end_date",
    "max_people",
    "gender_pref",
    "age_range",
    "budget_text",
    "contact_method",
    "status",
  ]) {
    if (key in body) update[key] = body[key];
  }

  const { error } = await supabase
    .from("partner_posts")
    .update(update)
    .eq("id", id);

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
    .from("partner_posts")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!post) return Response.json({ error: "찾을 수 없어요." }, { status: 404 });

  const adminFlag = await isAdmin(session.user.id);
  if (post.user_id !== session.user.id && !adminFlag) {
    return Response.json({ error: "권한이 없어요." }, { status: 403 });
  }

  const { error } = await supabase
    .from("partner_posts")
    .update({ is_deleted: true })
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
