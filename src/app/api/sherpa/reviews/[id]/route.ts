// 셰르파 답글 / 후기 숨김 / 수정
//
// PATCH /api/sherpa/reviews/[id]
//   { reply: string }    — 셰르파 본인 답글
//   { status: 'hidden' } — 운영자만 (관리자 권한 필요, 추후)
//
// MVP: 셰르파 답글만 지원

import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { notifyReviewReplied } from "@/lib/notifications";

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
  let body: { reply?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const reply = body.reply?.trim();
  if (!reply || reply.length < 5) {
    return Response.json(
      { error: "답글은 5자 이상 작성해주세요." },
      { status: 400 }
    );
  }
  if (reply.length > 1000) {
    return Response.json(
      { error: "답글은 1000자 이내여야 합니다." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServiceClient();

  // 후기 + 셰르파 user_id 조회
  const { data: review } = await supabase
    .from("sherpa_reviews")
    .select("id, sherpa_id, sherpa_reply, sherpas(user_id)")
    .eq("id", id)
    .maybeSingle();
  if (!review) {
    return Response.json({ error: "후기를 찾을 수 없어요." }, { status: 404 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sherpaUserId = (review as any).sherpas?.user_id as string | undefined;
  if (sherpaUserId !== session.user.id) {
    return Response.json(
      { error: "본인 후기에만 답글을 달 수 있어요." },
      { status: 403 }
    );
  }
  if (review.sherpa_reply) {
    return Response.json({ error: "이미 답글이 있어요." }, { status: 409 });
  }

  const { error } = await supabase
    .from("sherpa_reviews")
    .update({
      sherpa_reply: reply,
      sherpa_replied_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return Response.json({ error: "저장 중 오류" }, { status: 500 });
  }

  // 여행자에게 알림 메일
  void notifyReviewReplied(id);

  return Response.json({ ok: true });
}
