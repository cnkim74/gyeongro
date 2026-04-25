import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "권한 없음" }, { status: 403 });

  const body = await req.json();
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("affiliate_products")
    .insert({
      category: body.category ?? "etc",
      name: body.name ?? "신규 상품",
      description: body.description ?? null,
      image_url: body.image_url ?? null,
      affiliate_url: body.affiliate_url ?? "#",
      price_text: body.price_text ?? null,
      display_order: body.display_order ?? 0,
      is_active: body.is_active ?? true,
    })
    .select("id")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ id: data.id });
}
