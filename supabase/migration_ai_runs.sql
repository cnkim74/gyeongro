-- ============================================================
-- AI 실행 기록 (실제 비용 추적용)
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복사/붙여넣기 → Run
-- AI 플래너를 1번 돌릴 때마다 1줄 기록 (토큰 수·실제 비용)
-- 관리자 → 'AI 사용량·비용' 화면에서 집계해서 보여줌
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES next_auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,              -- 'planner' | 'festival_curate' | ...
  calls integer NOT NULL DEFAULT 0,  -- Claude API 호출 수 (재시도 포함)
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric(10, 5) NOT NULL DEFAULT 0,
  ok boolean NOT NULL DEFAULT true,  -- 끝까지 완성됐는지
  meta jsonb,                        -- 여행 일수·목적지·소요시간 등
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_runs_created ON public.ai_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_runs_action ON public.ai_runs (action, created_at DESC);

ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.ai_runs TO service_role;

NOTIFY pgrst, 'reload schema';
