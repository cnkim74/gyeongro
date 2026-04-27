// 관리자 — 클리닉 게시 상태 변경
//
// PATCH /api/admin/medical/clinics/[id]
//   { action: 'publish' | 'reject' | 'archive', reason? }

import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { clinicApprovedEmail, clinicRejectedEmail } from "@/lib/email-templates";

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
  let nextStatus: "published" | "rejected" | "archived" | null = null;
  if (action === "publish") nextStatus = "published";
  else if (action === "reject") nextStatus = "rejected";
  else if (action === "archive") nextStatus = "archived";
  else return Response.json({ error: "잘못된 액션" }, { status: 400 });

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("medical_clinics")
    .update({
      status: nextStatus,
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: nextStatus === "rejected" ? body.reason ?? null : null,
    })
    .eq("id", id);

  if (error) {
    return Response.json({ error: "처리 중 오류" }, { status: 500 });
  }

  // 이메일 알림 (publish/reject 만)
  if (nextStatus === "published" || nextStatus === "rejected") {
    void notifyClinic(id, nextStatus, body.reason ?? null);
  }

  return Response.json({ ok: true, status: nextStatus });
}

async function notifyClinic(
  clinicId: string,
  status: "published" | "rejected",
  reason: string | null
) {
  try {
    const supabase = getSupabaseServiceClient();
    const { data: clinic } = await supabase
      .from("medical_clinics")
      .select("name, slug, contact_email, submitted_by, source")
      .eq("id", clinicId)
      .maybeSingle();
    if (!clinic) return;
    // AI 큐레이션은 등록자가 관리자 자신이라 알림 불필요
    if (clinic.source === "ai_curated") return;

    // 1순위: 클리닉 contact_email, 2순위: 등록한 사용자의 이메일
    let to = clinic.contact_email as string | null;
    if (!to && clinic.submitted_by) {
      const { data: user } = await supabase
        .schema("next_auth")
        .from("users")
        .select("email")
        .eq("id", clinic.submitted_by)
        .maybeSingle();
      to = user?.email ?? null;
    }
    if (!to) return;

    const tpl =
      status === "published"
        ? clinicApprovedEmail({ clinicName: clinic.name, slug: clinic.slug })
        : clinicRejectedEmail({ clinicName: clinic.name, reason });

    await sendEmail({ to, subject: tpl.subject, html: tpl.html });
  } catch (err) {
    console.error("[notifyClinic] failed:", err);
  }
}
