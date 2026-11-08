// AI 실행 1건의 실제 토큰·비용 기록 (관리자 'AI 사용량·비용' 화면용)
// 테이블(ai_runs)이 아직 없거나 저장에 실패해도 서비스에는 영향 없음

import { getSupabaseServiceClient } from "./supabase";

/** 원·달러 환산 (대략) */
export const KRW_PER_USD = 1400;

/** 실측 기록이 없을 때 쓰는 AI 플래너 1회 추정 비용 (USD) — 4일 일정 기준 */
export const PLANNER_EST_USD = 0.3;

export async function recordAiRun(run: {
  userId: string | null;
  action: string;
  calls: number;
  input: number;
  output: number;
  usd: number;
  ok: boolean;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const { error } = await getSupabaseServiceClient()
      .from("ai_runs")
      .insert({
        user_id: run.userId,
        action: run.action,
        calls: run.calls,
        input_tokens: run.input,
        output_tokens: run.output,
        cost_usd: Number(run.usd.toFixed(5)),
        ok: run.ok,
        meta: run.meta ?? null,
      });
    if (error) console.log(`[ai-runs] 기록 실패: ${error.message}`);
  } catch (e) {
    console.log(`[ai-runs] 기록 실패: ${e instanceof Error ? e.message : e}`);
  }
}

/** 모델별 100만 토큰당 가격 (USD) */
const PRICES: Record<string, { input: number; output: number }> = {
  opus: { input: 4, output: 20 },
  sonnet: { input: 2, output: 10 },
  haiku: { input: 0.1, output: 0.5 },
};
/** 웹 검색 1회 (USD) */
const WEB_SEARCH_USD = 0.01;

type UsageLike = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  server_tool_use?: { web_search_requests?: number | null } | null;
};

/** 여러 번 부른 AI 호출의 토큰·비용을 모아서 recordAiRun 으로 남기는 도우미 */
export function aiMeter(model: string) {
  const price = PRICES[Object.keys(PRICES).find((k) => model.includes(k)) ?? "sonnet"];
  const t = { calls: 0, input: 0, output: 0, usd: 0 };
  return {
    add(usage: UsageLike | undefined | null) {
      if (!usage) return;
      const input = usage.input_tokens + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0);
      t.calls++;
      t.input += input;
      t.output += usage.output_tokens;
      t.usd += (input * price.input + usage.output_tokens * price.output) / 1_000_000 + (usage.server_tool_use?.web_search_requests ?? 0) * WEB_SEARCH_USD;
    },
    async record(action: string, userId: string | null, ok: boolean, meta?: Record<string, unknown>) {
      if (t.calls === 0) return;
      await recordAiRun({ userId, action, calls: t.calls, input: t.input, output: t.output, usd: t.usd, ok, meta });
    },
  };
}
