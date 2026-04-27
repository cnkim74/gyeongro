// 의료관광 옵션 조회 (플래너에서 사용)
//
// GET /api/medical/options
//   -> { procedures: [...] }   (전체 시술 카테고리)
//
// GET /api/medical/options?procedure=plastic-surgery&destination=서울
//   -> { clinics: [...] }   (해당 시술 + 도시명 부분일치 클리닉)

import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const procedure = url.searchParams.get("procedure");
  const destination = url.searchParams.get("destination")?.trim();

  const supabase = getSupabaseServiceClient();

  if (!procedure) {
    const { data } = await supabase
      .from("medical_procedures")
      .select("slug, name_ko, emoji, recovery_days")
      .order("display_order");
    return Response.json({ procedures: data ?? [] });
  }

  let query = supabase
    .from("medical_clinics")
    .select("id, name, city, country, direction")
    .eq("status", "published")
    .contains("procedures", [procedure])
    .order("display_order")
    .limit(20);

  if (destination) {
    // 도시명 부분일치 (한글 + 공백 처리)
    query = query.ilike("city", `%${destination}%`);
  }

  const { data } = await query;
  return Response.json({ clinics: data ?? [] });
}
