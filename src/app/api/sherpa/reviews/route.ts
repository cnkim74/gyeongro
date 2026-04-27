// 셰르파 후기 작성 API
//
// POST { sherpaId, bookingId? | proposalId?, rating, comment }
//   -> 201 { id }
//
// 작성 자격:
//   - bookingId가 있으면: 본인이 client인 booking이 'completed' 상태여야
//   - proposalId가 있으면: 본인이 trip 소유자이고 proposal이 'accepted' 상태여야
// 한 booking/proposal 당 한 번만 (UNIQUE constraint)

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
    sherpaId?: string;
    bookingId?: string;
    proposalId?: string;
    rating?: number;
    comment?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  if (!body.sherpaId) {
    return Response.json({ error: "셰르파 ID가 필요해요." }, { status: 400 });
  }
  if (!body.bookingId && !body.proposalId) {
    return Response.json(
      { error: "예약 또는 매칭 정보가 필요해요." },
      { status: 400 }
    );
  }
  if (
    typeof body.rating !== "number" ||
    body.rating < 1 ||
    body.rating > 5
  ) {
    return Response.json(
      { error: "별점은 1~5 사이여야 해요." },
      { status: 400 }
    );
  }
  const comment = body.comment?.trim() ?? "";
  if (comment.length < 10) {
    return Response.json(
      { error: "후기는 10자 이상 작성해주세요." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServiceClient();

  // 자격 검증
  if (body.bookingId) {
    const { data: booking } = await supabase
      .from("sherpa_bookings")
      .select("id, status, sherpa_id, client_id")
      .eq("id", body.bookingId)
      .maybeSingle();
    if (!booking) {
      return Response.json({ error: "예약을 찾을 수 없어요." }, { status: 404 });
    }
    if (booking.client_id !== session.user.id) {
      return Response.json(
        { error: "본인 예약에 대해서만 후기를 쓸 수 있어요." },
        { status: 403 }
      );
    }
    if (booking.status !== "completed") {
      return Response.json(
        { error: "완료된 예약에 대해서만 후기를 쓸 수 있어요." },
        { status: 400 }
      );
    }
    if (booking.sherpa_id !== body.sherpaId) {
      return Response.json({ error: "잘못된 셰르파입니다." }, { status: 400 });
    }
  } else if (body.proposalId) {
    const { data: proposal } = await supabase
      .from("sherpa_proposals")
      .select(
        "id, status, sherpa_id, travel_plans!inner(user_id)"
      )
      .eq("id", body.proposalId)
      .maybeSingle();
    if (!proposal) {
      return Response.json({ error: "제안을 찾을 수 없어요." }, { status: 404 });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tripOwnerId = (proposal as any).travel_plans?.user_id as string | undefined;
    if (tripOwnerId !== session.user.id) {
      return Response.json(
        { error: "본인 여행에 대해서만 후기를 쓸 수 있어요." },
        { status: 403 }
      );
    }
    if (proposal.status !== "accepted") {
      return Response.json(
        { error: "수락된 매칭에 대해서만 후기를 쓸 수 있어요." },
        { status: 400 }
      );
    }
    if (proposal.sherpa_id !== body.sherpaId) {
      return Response.json({ error: "잘못된 셰르파입니다." }, { status: 400 });
    }
  }

  const { data: inserted, error } = await supabase
    .from("sherpa_reviews")
    .insert({
      sherpa_id: body.sherpaId,
      client_id: session.user.id,
      booking_id: body.bookingId ?? null,
      proposal_id: body.proposalId ?? null,
      rating: body.rating,
      comment,
      status: "visible",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json(
        { error: "이미 후기를 작성하셨어요." },
        { status: 409 }
      );
    }
    return Response.json({ error: "저장 중 오류" }, { status: 500 });
  }

  return Response.json({ id: inserted?.id }, { status: 201 });
}
