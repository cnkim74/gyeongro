// 셰르파 제안 제출 API
//
// POST { tripId, proposedPriceKrw, proposedScope, message }
//   -> 201 { id }
//
// 제출자: 셰르파 본인만 (sherpas.user_id = session.user.id)
// 한 셰르파는 한 여행에 한 번만 제안 (UNIQUE constraint)

import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  let body: {
    tripId?: string;
    proposedPriceKrw?: number;
    proposedScope?: string;
    message?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  if (!body.tripId || !body.proposedScope?.trim() || !body.message?.trim()) {
    return Response.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
  }
  if (!body.proposedPriceKrw || body.proposedPriceKrw < 0) {
    return Response.json({ error: "올바른 가격을 입력해주세요." }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  // 셰르파 프로필 확인
  const { data: sherpa } = await supabase
    .from("sherpas")
    .select("id, status")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (!sherpa) {
    return Response.json(
      { error: "셰르파로 등록되지 않았어요." },
      { status: 403 }
    );
  }
  if (sherpa.status !== "published") {
    return Response.json(
      { error: "셰르파 활동 승인 후에 제안할 수 있어요." },
      { status: 403 }
    );
  }

  // 여행 검증
  const { data: trip } = await supabase
    .from("travel_plans")
    .select("id, seeking_sherpa, user_id")
    .eq("id", body.tripId)
    .maybeSingle();
  if (!trip || !trip.seeking_sherpa) {
    return Response.json(
      { error: "공개된 여행이 아닙니다." },
      { status: 400 }
    );
  }
  if (trip.user_id === session.user.id) {
    return Response.json(
      { error: "본인 여행에는 제안할 수 없습니다." },
      { status: 400 }
    );
  }

  const { data: inserted, error } = await supabase
    .from("sherpa_proposals")
    .insert({
      trip_id: body.tripId,
      sherpa_id: sherpa.id,
      proposed_price_krw: Math.round(body.proposedPriceKrw),
      proposed_scope: body.proposedScope.trim(),
      message: body.message.trim(),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json(
        { error: "이미 이 여행에 제안하셨어요." },
        { status: 409 }
      );
    }
    return Response.json({ error: "제출 중 오류" }, { status: 500 });
  }

  return Response.json({ id: inserted?.id }, { status: 201 });
}
