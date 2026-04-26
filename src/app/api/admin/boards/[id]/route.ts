import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "권한 없음" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const update: Record<string, unknown> = {};
  if (body.slug !== undefined) {
    const slug = body.slug.toString().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!slug) return Response.json({ error: "유효한 slug 필요" }, { status: 400 });
    update.slug = slug;
  }
  for (const key of [
    "name",
    "description",
    "icon",
    "display_order",
    "is_published",
    "is_admin_only",
  ]) {
    if (key in body) update[key] = body[key];
  }

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("boards").update(update).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "권한 없음" }, { status: 403 });

  const { id } = await params;
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("boards").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
