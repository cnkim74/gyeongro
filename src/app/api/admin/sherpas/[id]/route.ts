// 관리자 — 셰르파 게시 상태 변경
//
// PATCH /api/admin/sherpas/[id]
//   { action: 'publish' | 'reject' | 'pause', reason? }

import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { sherpaApprovedEmail, sherpaRejectedEmail } from "@/lib/email-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  }

  const { id } = await ctx.params;
  let body: { action?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const action = body.action;
  let nextStatus: "published" | "rejected" | "paused" | null = null;
  let updates: Record<string, unknown> = {};
  if (action === "publish") {
    nextStatus = "published";
    updates = { verified_at: new Date().toISOString(), verified_id: true };
  } else if (action === "reject") nextStatus = "rejected";
  else if (action === "pause") nextStatus = "paused";
  else return Response.json({ error: "잘못된 액션" }, { status: 400 });

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("sherpas")
    .update({
      status: nextStatus,
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: nextStatus === "rejected" ? body.reason ?? null : null,
      ...updates,
    })
    .eq("id", id);

  if (error) {
    return Response.json({ error: "처리 중 오류" }, { status: 500 });
  }

  // 이메일 알림 (publish/reject 만 — pause는 본인이 한 거니 알림 불필요하지만
  // 관리자가 강제로 pause 할 수도 있으니 추후 별도 안내)
  if (nextStatus === "published" || nextStatus === "rejected") {
    void notifySherpa(id, nextStatus, body.reason ?? null);
  }

  return Response.json({ ok: true, status: nextStatus });
}

async function notifySherpa(
  sherpaId: string,
  status: "published" | "rejected",
  reason: string | null
) {
  try {
    const supabase = getSupabaseServiceClient();
    const { data: sherpa } = await supabase
      .from("sherpas")
      .select("display_name, user_id")
      .eq("id", sherpaId)
      .maybeSingle();
    if (!sherpa?.user_id) return; // AI 큐레이션은 user_id NULL이라 알림 X

    const { data: user } = await supabase
      .schema("next_auth")
      .from("users")
      .select("email, name, nickname")
      .eq("id", sherpa.user_id)
      .maybeSingle();
    if (!user?.email) return;

    const recipientName = user.nickname ?? user.name ?? sherpa.display_name;
    const tpl =
      status === "published"
        ? sherpaApprovedEmail({ recipientName })
        : sherpaRejectedEmail({ recipientName, reason });

    await sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html });
  } catch (err) {
    console.error("[notifySherpa] failed:", err);
  }
}
