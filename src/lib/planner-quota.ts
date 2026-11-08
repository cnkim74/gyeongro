// AI 플래너 이용 한도 — 무료(기본 AI) / 이용권(고급 AI) — 서버 전용
//
// • 무료: 한 달(KST) N회, 기본 AI (저가·빠른 모델)
// • 이용권(ai_credits): 1장 = 고급 AI 1회. 만료일이 가까운 것부터 차감
// • 관리자: 제한 없음 (원하는 등급으로 실행)
// • 일정 생성이 실패하면 차감을 되돌림 (refund)
//
// 기록(ai_usage)
//   - action "planner"      : 전체 실행 수 (통계용 — 관리자 'AI 사용량·비용')
//   - action "planner_free" : 무료 한도 계산용 (월 합계)

import { getSupabaseServiceClient } from "./supabase";
import { getUserRole, type UserRole } from "./admin";

export type PlannerTier = "basic" | "premium";

/** 역할별 무료(기본 AI) 월 횟수 */
export const FREE_MONTHLY: Record<UserRole, number> = {
  user: 5,
  sherpa: 10,
  business: 5,
  admin: 9999,
};

export class PlannerQuotaError extends Error {
  status = 429;
  code: "free_exhausted" | "no_credits";
  constructor(code: "free_exhausted" | "no_credits", message: string) {
    super(message);
    this.code = code;
  }
}

function kstDate(d = new Date()): string {
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}
function monthStartKst(): string {
  return `${kstDate().slice(0, 7)}-01`;
}

async function addUsage(userId: string, action: string, delta: number) {
  const supabase = getSupabaseServiceClient();
  const today = kstDate();
  const { data } = await supabase
    .from("ai_usage")
    .select("id, count")
    .eq("user_id", userId)
    .eq("action", action)
    .eq("used_on", today)
    .maybeSingle();
  if (data) {
    await supabase.from("ai_usage").update({ count: Math.max(0, data.count + delta) }).eq("id", data.id);
  } else if (delta > 0) {
    await supabase.from("ai_usage").insert({ user_id: userId, action, used_on: today, count: delta });
  }
}

/** 이번 달 무료 사용 수 */
async function freeUsedThisMonth(userId: string): Promise<number> {
  const { data } = await getSupabaseServiceClient()
    .from("ai_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("action", "planner_free")
    .gte("used_on", monthStartKst());
  return (data ?? []).reduce((s, r) => s + (r.count ?? 0), 0);
}

/** 쓸 수 있는 이용권 (만료 안 된 것, 플래너용 또는 만능) */
async function activeCredits(userId: string) {
  const nowIso = new Date().toISOString();
  const { data } = await getSupabaseServiceClient()
    .from("ai_credits")
    .select("id, remaining, expires_at, source")
    .eq("user_id", userId)
    .gt("remaining", 0)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .or("action.is.null,action.eq.planner")
    .order("expires_at", { ascending: true, nullsFirst: false });
  return data ?? [];
}

/** 화면 표시용 — 남은 무료 횟수·이용권 */
export async function getPlannerQuota(userId: string) {
  const role = await getUserRole(userId);
  const isAdmin = role === "admin";
  const freeLimit = FREE_MONTHLY[role] ?? 5;
  const [freeUsed, credits] = await Promise.all([freeUsedThisMonth(userId), activeCredits(userId)]);
  const creditCount = credits.reduce((s, c) => s + c.remaining, 0);
  const soonest = credits.find((c) => c.expires_at)?.expires_at ?? null;
  return {
    isAdmin,
    freeLimit: isAdmin ? null : freeLimit,
    freeUsed,
    freeRemaining: isAdmin ? null : Math.max(0, freeLimit - freeUsed),
    credits: creditCount,
    creditsExpireAt: soonest,
  };
}

/**
 * 한도 확인 + 차감. 요청 등급이 없으면 이용권이 있으면 고급, 없으면 기본.
 * 반환된 refund() 는 일정 생성 실패 시 호출.
 */
export async function consumePlanner(
  userId: string,
  requested?: PlannerTier
): Promise<{ tier: PlannerTier; source: "admin" | "credit" | "free"; refund: () => Promise<void> }> {
  const supabase = getSupabaseServiceClient();
  const role = await getUserRole(userId);

  // 관리자: 제한 없음
  if (role === "admin") {
    await addUsage(userId, "planner", 1);
    return { tier: requested ?? "premium", source: "admin", refund: async () => {} };
  }

  const credits = await activeCredits(userId);
  const tier: PlannerTier = requested ?? (credits.length > 0 ? "premium" : "basic");

  if (tier === "premium") {
    const credit = credits[0];
    if (!credit) {
      throw new PlannerQuotaError("no_credits", "고급 AI 이용권이 없어요. 기본 AI로 만들거나 이용권을 구매해 주세요.");
    }
    await supabase.from("ai_credits").update({ remaining: credit.remaining - 1 }).eq("id", credit.id);
    await addUsage(userId, "planner", 1);
    return {
      tier,
      source: "credit",
      refund: async () => {
        // 실패 → 이용권 1회 되돌리기 (그 사이 다른 차감이 있어도 안전하게 현재 값에 +1)
        const { data } = await supabase.from("ai_credits").select("remaining").eq("id", credit.id).maybeSingle();
        if (data) await supabase.from("ai_credits").update({ remaining: data.remaining + 1 }).eq("id", credit.id);
        await addUsage(userId, "planner", -1);
      },
    };
  }

  const limit = FREE_MONTHLY[role] ?? 5;
  const used = await freeUsedThisMonth(userId);
  if (used >= limit) {
    throw new PlannerQuotaError(
      "free_exhausted",
      credits.length > 0
        ? `이번 달 무료 횟수(${limit}회)를 다 썼어요. 이용권으로 고급 AI를 쓸 수 있어요.`
        : `이번 달 무료 횟수(${limit}회)를 다 썼어요. 다음 달 1일에 다시 채워져요. 이용권을 구매하면 바로 쓸 수 있어요.`
    );
  }
  await addUsage(userId, "planner_free", 1);
  await addUsage(userId, "planner", 1);
  return {
    tier,
    source: "free",
    refund: async () => {
      await addUsage(userId, "planner_free", -1);
      await addUsage(userId, "planner", -1);
    },
  };
}
