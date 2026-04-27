// 셰르파 직접 예약 응답 API (셰르파만 호출 가능)
//
// PATCH /api/sherpa/bookings/[id]
//   { action: 'accept' | 'decline' | 'complete', message?, declinedReason? }

import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { id } = await ctx.params;
  let body: { action?: string; message?: string; declinedReason?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const action = body.action;
  if (!["accept", "decline", "complete"].includes(action ?? "")) {
    return Response.json({ error: "잘못된 액션" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  const { data: booking } = await supabase
    .from("sherpa_bookings")
    .select("id, status, sherpa_id, sherpas(user_id)")
    .eq("id", id)
    .maybeSingle();

  if (!booking) {
    return Response.json({ error: "예약을 찾을 수 없어요." }, { status: 404 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerId = (booking as any).sherpas?.user_id as string | undefined;
  if (ownerId !== session.user.id) {
    return Response.json(
      { error: "본인 셰르파 예약만 처리할 수 있어요." },
      { status: 403 }
    );
  }

  const updates: Record<string, unknown> = {
    responded_at: new Date().toISOString(),
  };

  if (action === "accept") {
    if (booking.status !== "pending") {
      return Response.json({ error: "이미 처리된 예약입니다." }, { status: 409 });
    }
    updates.status = "accepted";
    updates.sherpa_message = body.message ?? null;
  } else if (action === "decline") {
    if (booking.status !== "pending") {
      return Response.json({ error: "이미 처리된 예약입니다." }, { status: 409 });
    }
    updates.status = "declined";
    updates.declined_reason = body.declinedReason ?? null;
  } else if (action === "complete") {
    if (booking.status !== "accepted") {
      return Response.json(
        { error: "수락된 예약만 완료 처리할 수 있어요." },
        { status: 409 }
      );
    }
    updates.status = "completed";
    updates.completed_at = new Date().toISOString();

    // 카운트 증가
    const { data: s } = await supabase
      .from("sherpas")
      .select("booking_count")
      .eq("id", booking.sherpa_id)
      .maybeSingle();
    if (s) {
      await supabase
        .from("sherpas")
        .update({ booking_count: (s.booking_count ?? 0) + 1 })
        .eq("id", booking.sherpa_id);
    }
  }

  const { error } = await supabase
    .from("sherpa_bookings")
    .update(updates)
    .eq("id", id);

  if (error) {
    return Response.json({ error: "처리 중 오류" }, { status: 500 });
  }
  return Response.json({ ok: true, status: updates.status });
}
