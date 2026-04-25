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
  for (const key of [
    "category",
    "name",
    "description",
    "image_url",
    "affiliate_url",
    "price_text",
    "display_order",
    "is_active",
  ]) {
    if (key in body) update[key] = body[key];
  }

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("affiliate_products")
    .update(update)
    .eq("id", id);

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
  const { error } = await supabase.from("affiliate_products").delete().eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
