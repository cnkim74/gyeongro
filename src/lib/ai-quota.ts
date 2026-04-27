// AI 사용 한도 체크 + 차감 헬퍼
//
// 흐름:
//   1) 크레딧(ai_credits.remaining > 0)이 있으면 그것부터 차감
//   2) 없으면 무료 일일 한도(ai_usage.count < limit)에서 차감
//   3) 둘 다 없으면 throw QuotaExceededError
//
// 무료 한도는 역할별로 다르게 줄 수 있음:
//   user(여행자)  → 일 5회
//   sherpa        → 일 10회 (도구 활용 빈도 높을 것 예상)
//   business      → 일 5회
//   admin         → 무제한 (체크 우회)

import { getSupabaseServiceClient } from "./supabase";
import { getUserRole, type UserRole } from "./admin";

export type AIAction = "planner" | "optimizer" | "translation";

export const FREE_DAILY_LIMITS: Record<UserRole, Partial<Record<AIAction, number>>> = {
  user: { planner: 5, optimizer: 3, translation: 30 },
  sherpa: { planner: 10, optimizer: 5, translation: 50 },
  business: { planner: 5, optimizer: 3, translation: 30 },
  admin: { planner: 999, optimizer: 999, translation: 9999 },
};

export class QuotaExceededError extends Error {
  status = 429;
  action: AIAction;
  used: number;
  limit: number;
  hasCredits: boolean;
  constructor(action: AIAction, used: number, limit: number, hasCredits: boolean) {
    super(`AI 사용 한도 초과 (${action}: ${used}/${limit})`);
    this.action = action;
    this.used = used;
    this.limit = limit;
    this.hasCredits = hasCredits;
  }
}

/** KST(Asia/Seoul) 기준의 오늘 날짜 (YYYY-MM-DD) */
function todayKST(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

/**
 * userId의 action 사용 한도를 체크하고 차감합니다.
 * - 크레딧 우선 차감, 없으면 무료 한도 차감
 * - 한도 초과면 QuotaExceededError throw
 *
 * @returns 차감 후 상태 정보
 */
export async function consumeQuota(
  userId: string,
  action: AIAction
): Promise<{
  source: "credit" | "free";
  used: number;
  limit: number;
  remainingCredits: number;
}> {
  const supabase = getSupabaseServiceClient();
  const role = await getUserRole(userId);
  const limit = FREE_DAILY_LIMITS[role][action] ?? 0;

  // 1. 활성 크레딧 조회 (action 일치 또는 만능권)
  const nowIso = new Date().toISOString();
  const { data: credits } = await supabase
    .from("ai_credits")
    .select("id, remaining, action, expires_at")
    .eq("user_id", userId)
    .gt("remaining", 0)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .or(`action.is.null,action.eq.${action}`)
    .order("expires_at", { ascending: true, nullsFirst: false })
    .limit(1);

  const credit = credits?.[0];
  if (credit && credit.remaining > 0) {
    const newRemaining = credit.remaining - 1;
    await supabase
      .from("ai_credits")
      .update({ remaining: newRemaining })
      .eq("id", credit.id);

    // 사용량 통계도 기록 (분석용, 한도엔 영향 없음)
    await recordUsage(userId, action);

    // 남은 총 크레딧 (모든 row 합)
    const { data: rest } = await supabase
      .from("ai_credits")
      .select("remaining")
      .eq("user_id", userId)
      .gt("remaining", 0);
    const remainingCredits =
      (rest ?? []).reduce((sum, r) => sum + r.remaining, 0) + 0;

    return {
      source: "credit",
      used: 0,
      limit,
      remainingCredits,
    };
  }

  // 2. 무료 일일 한도 체크
  const today = todayKST();
  const { data: usage } = await supabase
    .from("ai_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("action", action)
    .eq("used_on", today)
    .maybeSingle();

  const used = usage?.count ?? 0;
  if (used >= limit) {
    // 다른 action 크레딧이라도 있는지 한 번 더 보는 정보(사용자 안내용)
    const { data: anyCredit } = await supabase
      .from("ai_credits")
      .select("id")
      .eq("user_id", userId)
      .gt("remaining", 0)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .limit(1)
      .maybeSingle();
    throw new QuotaExceededError(action, used, limit, !!anyCredit);
  }

  await recordUsage(userId, action);
  return {
    source: "free",
    used: used + 1,
    limit,
    remainingCredits: 0,
  };
}

/** 일일 사용량을 1 증가 (UPSERT) */
async function recordUsage(userId: string, action: AIAction): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const today = todayKST();

  // UPSERT — 있으면 count+1, 없으면 신규 1
  const { data: existing } = await supabase
    .from("ai_usage")
    .select("id, count")
    .eq("user_id", userId)
    .eq("action", action)
    .eq("used_on", today)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("ai_usage")
      .update({ count: existing.count + 1 })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("ai_usage")
      .insert({ user_id: userId, action, used_on: today, count: 1 });
  }
}

/**
 * 차감 없이 현재 상태만 조회 (UI에서 한도 표시용)
 */
export async function getQuotaStatus(
  userId: string,
  action: AIAction
): Promise<{
  used: number;
  limit: number;
  remaining: number;
  remainingCredits: number;
}> {
  const supabase = getSupabaseServiceClient();
  const role = await getUserRole(userId);
  const limit = FREE_DAILY_LIMITS[role][action] ?? 0;
  const today = todayKST();
  const nowIso = new Date().toISOString();

  const [usageRes, creditsRes] = await Promise.all([
    supabase
      .from("ai_usage")
      .select("count")
      .eq("user_id", userId)
      .eq("action", action)
      .eq("used_on", today)
      .maybeSingle(),
    supabase
      .from("ai_credits")
      .select("remaining, action")
      .eq("user_id", userId)
      .gt("remaining", 0)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`),
  ]);

  const used = usageRes.data?.count ?? 0;
  const remaining = Math.max(0, limit - used);
  const remainingCredits = (creditsRes.data ?? [])
    .filter((c) => c.action === null || c.action === action)
    .reduce((sum, c) => sum + c.remaining, 0);

  return { used, limit, remaining, remainingCredits };
}
