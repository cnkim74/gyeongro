// 관리자 — 셰르파 게시 상태 변경
//
// PATCH /api/admin/sherpas/[id]
//   { action: 'publish' | 'reject' | 'pause', reason? }

import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";

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
  return Response.json({ ok: true, status: nextStatus });
}
