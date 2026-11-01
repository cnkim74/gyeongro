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
