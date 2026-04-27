// 제안 수락/거절/철회
//
// PATCH /api/sherpa/proposals/[id]
//   { action: 'accept' | 'decline' | 'withdraw', reason? }

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
  let body: { action?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  if (!["accept", "decline", "withdraw"].includes(body.action ?? "")) {
    return Response.json({ error: "잘못된 액션" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  const { data: prop } = await supabase
    .from("sherpa_proposals")
    .select(
      "id, status, trip_id, sherpa_id, sherpas(user_id), travel_plans!inner(user_id)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!prop) {
    return Response.json({ error: "제안을 찾을 수 없어요." }, { status: 404 });
  }
  if (prop.status !== "pending") {
    return Response.json(
      { error: "이미 처리된 제안입니다." },
      { status: 409 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sherpaUserId = (prop as any).sherpas?.user_id as string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tripOwnerId = (prop as any).travel_plans?.user_id as string | undefined;

  if (body.action === "withdraw") {
    if (sherpaUserId !== session.user.id) {
      return Response.json(
        { error: "본인 제안만 철회할 수 있어요." },
        { status: 403 }
      );
    }
    await supabase
      .from("sherpa_proposals")
      .update({ status: "withdrawn", responded_at: new Date().toISOString() })
      .eq("id", id);
    return Response.json({ ok: true });
  }

  // accept / decline 은 여행 소유자만
  if (tripOwnerId !== session.user.id) {
    return Response.json(
      { error: "여행 소유자만 처리할 수 있어요." },
      { status: 403 }
    );
  }

  const newStatus = body.action === "accept" ? "accepted" : "declined";
  const { error } = await supabase
    .from("sherpa_proposals")
    .update({
      status: newStatus,
      declined_reason: body.action === "decline" ? body.reason ?? null : null,
      responded_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return Response.json({ error: "처리 중 오류" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
