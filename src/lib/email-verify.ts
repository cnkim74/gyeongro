// 이메일 인증 (이메일·비밀번호 가입 회원) — 서버 전용
//
// - 인증된 것으로 보는 회원: emailVerified 가 있음 / 비밀번호 없이 가입(구글·카카오·네이버 등 소셜) / 소셜 계정 연결 / 관리자
// - 인증 코드: 6자리, 10분 유효, next_auth.verification_tokens 에 해시로 저장 (원문 저장 안 함)
// - 보내기 1분에 1번·1시간 5번, 확인 시도 10분에 5번까지
// - 메일 발송이 설정되지 않은 환경(RESEND_API_KEY 없음·발신 주소가 resend.dev)에서는 인증을 요구하지 않음
//   (메일을 못 보내는데 인증을 요구하면 아무도 플래너를 못 씀)

import crypto from "node:crypto";
import { getSupabaseServiceClient } from "./supabase";
import { sendEmail } from "./email";
import { verifyCodeEmail } from "./email-templates";
import { isAdmin } from "./admin";

const TTL_MS = 10 * 60 * 1000;

export function emailVerifyRequired(): boolean {
  const from = process.env.EMAIL_FROM ?? "";
  return !!process.env.RESEND_API_KEY && !!from && !/resend\.dev/i.test(from);
}

const hash = (userId: string, code: string) => crypto.createHash("sha256").update(`${userId}:${code}`).digest("hex");

export async function isEmailVerified(userId: string): Promise<boolean> {
  const db = getSupabaseServiceClient().schema("next_auth");
  const { data: u } = await db.from("users").select("*").eq("id", userId).maybeSingle();
  if (!u) return false;
  if ((u as { emailVerified?: string | null }).emailVerified) return true;
  // 비밀번호 없이 가입 = 소셜 로그인 가입 (이메일은 해당 서비스가 이미 확인)
  if (!(u as { password_hash?: string | null }).password_hash) return true;
  const { count } = await db.from("accounts").select("id", { count: "exact", head: true }).eq("userId", userId);
  if ((count ?? 0) > 0) return true;
  return isAdmin(userId);
}

/** 플래너를 쓰려면 인증이 필요한지 */
export async function needsEmailVerify(userId: string): Promise<boolean> {
  if (!emailVerifyRequired()) return false;
  return !(await isEmailVerified(userId));
}

async function countRecent(identifier: string, sinceMs: number): Promise<number> {
  const db = getSupabaseServiceClient().schema("next_auth");
  // 만료 시각 = 만든 시각 + TTL → '최근 N분 안에 만든 것' = expires > now - N + TTL
  const { count } = await db
    .from("verification_tokens")
    .select("token", { count: "exact", head: true })
    .eq("identifier", identifier)
    .gt("expires", new Date(Date.now() - sinceMs + TTL_MS).toISOString());
  return count ?? 0;
}

export async function sendVerifyCode(userId: string): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const db = getSupabaseServiceClient().schema("next_auth");
  const { data: u } = await db.from("users").select("email, nickname, name").eq("id", userId).maybeSingle();
  const email = (u as { email?: string | null } | null)?.email;
  if (!email) return { ok: false, error: "가입한 이메일 주소를 찾을 수 없어요." };
  const id = `verify:${userId}`;
  if ((await countRecent(id, 60_000)) >= 1) return { ok: false, error: "코드를 방금 보냈어요. 1분 뒤에 다시 받을 수 있어요." };
  if ((await countRecent(id, 3_600_000)) >= 5) return { ok: false, error: "코드 요청이 너무 많아요. 1시간 뒤에 다시 시도해 주세요." };
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  const { error } = await db.from("verification_tokens").insert({ identifier: id, token: hash(userId, code), expires: new Date(Date.now() + TTL_MS).toISOString() });
  if (error) return { ok: false, error: "코드를 만들지 못했어요. 잠시 후 다시 시도해 주세요." };
  const u2 = u as { nickname?: string | null; name?: string | null };
  const tpl = verifyCodeEmail({ name: u2.nickname || u2.name || null, code });
  const sent = await sendEmail({ to: email, subject: tpl.subject, html: tpl.html });
  if (!sent.ok) return { ok: false, error: "메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요." };
  return { ok: true, email };
}

export async function confirmVerifyCode(userId: string, code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const clean = code.replace(/\D/g, "");
  if (clean.length !== 6) return { ok: false, error: "6자리 숫자를 입력해 주세요." };
  const db = getSupabaseServiceClient().schema("next_auth");
  const tryId = `verify-try:${userId}`;
  if ((await countRecent(tryId, TTL_MS)) >= 5) return { ok: false, error: "시도가 너무 많아요. 10분 뒤에 새 코드를 받아 주세요." };
  await db.from("verification_tokens").insert({ identifier: tryId, token: crypto.randomUUID(), expires: new Date(Date.now() + TTL_MS).toISOString() });
  const { data } = await db
    .from("verification_tokens")
    .select("token")
    .eq("identifier", `verify:${userId}`)
    .eq("token", hash(userId, clean))
    .gt("expires", new Date().toISOString())
    .maybeSingle();
  if (!data) return { ok: false, error: "코드가 맞지 않거나 시간이 지났어요." };
  await db.from("users").update({ emailVerified: new Date().toISOString() }).eq("id", userId);
  await db.from("verification_tokens").delete().in("identifier", [`verify:${userId}`, tryId]);
  return { ok: true };
}
