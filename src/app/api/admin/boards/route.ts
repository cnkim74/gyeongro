import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "권한 없음" }, { status: 403 });

  const body = await req.json();
  const slug = (body.slug ?? "").toString().toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!slug) {
    return Response.json({ error: "유효한 slug를 입력해주세요." }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("boards")
    .insert({
      slug,
      name: body.name ?? "새 게시판",
      description: body.description ?? null,
      icon: body.icon ?? "📋",
      display_order: body.display_order ?? 0,
      is_published: body.is_published ?? true,
      is_admin_only: body.is_admin_only ?? false,
    })
    .select("id")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ id: data.id });
}
