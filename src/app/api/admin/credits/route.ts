// 이용권 지급 (관리자) — 결제 연동 전 이벤트·보상·테스트용
// POST { email, amount, days } -> { ok, userName }
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { email?: string; amount?: number; days?: number };
  const email = String(body.email ?? "").trim().toLowerCase();
  const amount = Math.round(Number(body.amount));
  const days = Math.round(Number(body.days));
  if (!email || !(amount >= 1 && amount <= 100) || !(days >= 1 && days <= 730)) {
    return Response.json({ error: "이메일, 횟수(1~100), 유효기간(1~730일)을 확인해 주세요." }, { status: 400 });
  }
  const supabase = getSupabaseServiceClient();
  const { data: user } = await supabase.schema("next_auth").from("users").select("id, name").ilike("email", email).maybeSingle();
  if (!user) return Response.json({ error: "그 이메일로 가입한 회원이 없어요." }, { status: 404 });
  const { error } = await supabase.from("ai_credits").insert({
    user_id: user.id,
    action: "planner",
    remaining: amount,
    granted: amount,
    source: "admin_grant",
    expires_at: new Date(Date.now() + days * 86400000).toISOString(),
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, userName: user.name });
}
