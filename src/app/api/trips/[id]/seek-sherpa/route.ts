// 여행자가 자신의 여행을 셰르파에게 공개/비공개 토글
//
// POST /api/trips/[id]/seek-sherpa
//   { open: true, notes?, requiredLanguages?[], requiredSpecialties?[], budgetMaxKrw? }
//   { open: false }
//
//   -> 200 { seekingSherpa }

import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const supabase = getSupabaseServiceClient();

  // 본인 여행인지 확인
  const { data: trip } = await supabase
    .from("travel_plans")
    .select("id")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (!trip) {
    return Response.json({ error: "여행을 찾을 수 없어요." }, { status: 404 });
  }

  let body: {
    open?: boolean;
    notes?: string;
    requiredLanguages?: string[];
    requiredSpecialties?: string[];
    budgetMaxKrw?: number;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  if (body.open === false) {
    await supabase
      .from("travel_plans")
      .update({
        seeking_sherpa: false,
        closed_at: new Date().toISOString(),
      })
      .eq("id", id);
    return Response.json({ seekingSherpa: false });
  }

  await supabase
    .from("travel_plans")
    .update({
      seeking_sherpa: true,
      sherpa_request_notes: body.notes ?? null,
      sherpa_required_languages: body.requiredLanguages ?? null,
      sherpa_required_specialties: body.requiredSpecialties ?? null,
      sherpa_budget_max_krw: body.budgetMaxKrw ?? null,
      open_at: new Date().toISOString(),
      closed_at: null,
    })
    .eq("id", id);

  return Response.json({ seekingSherpa: true });
}
