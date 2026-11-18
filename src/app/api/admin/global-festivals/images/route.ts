// 해외 축제·박람회 대표 사진 채우기 (관리자) — 사진이 없는 항목만, 한 번에 최대 15개
// POST -> { filled, missing, remaining }
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { findFreeImage } from "@/lib/commons-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST() {
  if (!(await requireAdmin())) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("global_festivals")
    .select("id, name_en, city, image_url")
    .is("image_url", null)
    .neq("status", "rejected")
    .limit(60);
  if (error) {
    return Response.json(
      { error: /image_url/.test(error.message) ? "사진 칸이 없어요. supabase/migration_global_festival_images.sql 을 먼저 실행해 주세요." : error.message },
      { status: 500 }
    );
  }
  let filled = 0;
  let missing = 0;
  for (const r of (data ?? []).slice(0, 15)) {
    const img = await findFreeImage(String(r.name_en ?? ""), String(r.city ?? "")).catch(() => null);
    if (!img) {
      missing++;
      continue;
    }
    await supabase.from("global_festivals").update({ image_url: img.url, image_credit: img.credit, image_credit_url: img.creditUrl }).eq("id", r.id);
    filled++;
  }
  revalidatePath("/festivals");
  return Response.json({ filled, missing, remaining: Math.max(0, (data ?? []).length - 15) });
}
