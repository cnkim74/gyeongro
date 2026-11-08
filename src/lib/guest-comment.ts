// 비회원 댓글 공용 도우미 — 서버 전용
//
// - 이름 + 비밀번호(지울 때 필요, scrypt 암호화 저장) + 이메일(선택, 답글 알림용)
// - 같은 브라우저에서는 쿠키(pothos_guest)로 '내 댓글'을 알아봄 → 비밀 댓글 다시 보기·바로 지우기
// - 스팸 방지: 숨은 칸(봇만 채움) · 너무 빠른 등록 차단 · 같은 IP 1분 3개·하루 30개 · 링크 2개 초과 차단
// - IP 는 그대로 저장하지 않고 해시만 저장

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getSupabaseServiceClient } from "./supabase";

export const GUEST_COOKIE = "pothos_guest";

/** 이 브라우저의 비회원 식별값 (없으면 null) — 페이지·API 공용 */
export async function readGuestToken(): Promise<string | null> {
  try {
    const v = (await cookies()).get(GUEST_COOKIE)?.value ?? "";
    return /^[a-f0-9]{32}$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

/** API 에서: 없으면 새로 만들어 쿠키로 심음 (1년) */
export async function ensureGuestToken(): Promise<string> {
  const cur = await readGuestToken();
  if (cur) return cur;
  const token = crypto.randomBytes(16).toString("hex");
  (await cookies()).set(GUEST_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return token;
}

export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 32).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(pw: string, stored: string | null | undefined): boolean {
  if (!stored || !pw) return false;
  const [, salt, hash] = stored.split("$");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(pw, salt, 32);
  const want = Buffer.from(hash, "hex");
  return want.length === test.length && crypto.timingSafeEqual(want, test);
}

export function ipHashOf(req: Request): string {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  const salt = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "pothos";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 40);
}

export type GuestInput = {
  guestName?: string;
  guestPassword?: string;
  guestEmail?: string;
  /** 숨은 칸 — 사람은 비워 둠 */
  website?: string;
  /** 입력 창을 연 시각 (ms) */
  openedAt?: number;
};

export type GuestFields = {
  guest_name: string;
  guest_password_hash: string;
  guest_email: string | null;
  guest_token: string;
  ip_hash: string;
};

/**
 * 비회원 입력 검사 + 스팸 방지. 통과하면 저장할 값, 아니면 오류 응답
 * table: 댓글 테이블 이름 (IP 제한 계산용)
 */
export async function checkGuest(
  req: Request,
  table: string,
  input: GuestInput,
  content: string
): Promise<{ ok: true; fields: GuestFields } | { ok: false; res: Response }> {
  const bad = (error: string, status = 400) => ({ ok: false as const, res: Response.json({ error }, { status }) });

  // 봇: 숨은 칸을 채움 / 창을 연 지 3초도 안 돼 등록
  if (input.website) return bad("등록할 수 없어요.");
  const opened = Number(input.openedAt);
  if (!opened || Date.now() - opened < 3000) return bad("조금만 천천히 다시 등록해 주세요.");

  const name = String(input.guestName ?? "").trim().replace(/\s+/g, " ");
  const pw = String(input.guestPassword ?? "");
  const email = String(input.guestEmail ?? "").trim();
  if (name.length < 1 || name.length > 20) return bad("이름은 1~20자로 써 주세요.");
  if (/관리자|운영자|운영팀|pothos|에디터/i.test(name)) return bad("이 이름은 쓸 수 없어요.");
  if (pw.length < 4 || pw.length > 64) return bad("비밀번호는 4자 이상으로 정해 주세요. (댓글을 지울 때 필요해요)");
  if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120)) return bad("이메일 형식을 확인해 주세요.");
  if ((content.match(/https?:\/\/|www\./gi) ?? []).length > 2) return bad("비회원 댓글에는 링크를 2개까지만 넣을 수 있어요.");

  const ip_hash = ipHashOf(req);
  const supabase = getSupabaseServiceClient();
  const since = (ms: number) => new Date(Date.now() - ms).toISOString();
  const [{ count: perMin }, { count: perDay }] = await Promise.all([
    supabase.from(table).select("id", { count: "exact", head: true }).eq("ip_hash", ip_hash).gte("created_at", since(60_000)),
    supabase.from(table).select("id", { count: "exact", head: true }).eq("ip_hash", ip_hash).gte("created_at", since(86_400_000)),
  ]);
  if ((perMin ?? 0) >= 3) return bad("잠시 후 다시 써 주세요.", 429);
  if ((perDay ?? 0) >= 30) return bad("오늘은 더 이상 비회원 댓글을 쓸 수 없어요. 로그인하면 계속 쓸 수 있어요.", 429);

  return {
    ok: true,
    fields: {
      guest_name: name,
      guest_password_hash: hashPassword(pw),
      guest_email: email || null,
      guest_token: await ensureGuestToken(),
      ip_hash,
    },
  };
}

/** 비회원 댓글을 지울 권한: 같은 브라우저(쿠키) 이거나 비밀번호가 맞음 */
export async function guestCanDelete(row: { guest_token?: string | null; guest_password_hash?: string | null }, password?: string) {
  const token = await readGuestToken();
  if (token && row.guest_token && token === row.guest_token) return true;
  return verifyPassword(String(password ?? ""), row.guest_password_hash);
}

/** 컬럼이 아직 없을 때(마이그레이션 전) 오류인지 */
export function isMissingGuestColumns(message: string) {
  return /guest_|ip_hash|null value in column "user_id"/.test(message);
}
