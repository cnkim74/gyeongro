-- ============================================================
-- AI 사용량 추적 (Step 4)
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복사/붙여넣기 → Run
-- ============================================================
-- 일 단위 무료 한도 + 향후 단발권/구독 등급별 한도를 위한 인프라
-- 'used_at'은 KST 기준 날짜로 저장 (자정 리셋)
-- ============================================================

-- 1. 사용량 일별 카운트 (UPSERT 패턴)
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,            -- 'planner' | 'optimizer' | 'translation' | ...
  used_on date NOT NULL,           -- KST 기준 (Asia/Seoul) 날짜
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, action, used_on)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date
  ON public.ai_usage (user_id, used_on DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_action_date
  ON public.ai_usage (action, used_on DESC);

DROP TRIGGER IF EXISTS ai_usage_touch_updated_at ON public.ai_usage;
CREATE TRIGGER ai_usage_touch_updated_at
  BEFORE UPDATE ON public.ai_usage
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. AI 크레딧 (단발권 / 구매 패스용 — Step 5에서 본격 사용)
CREATE TABLE IF NOT EXISTS public.ai_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  action text,                    -- NULL이면 모든 action에 사용 가능 (만능권)
  remaining integer NOT NULL DEFAULT 0,
  granted integer NOT NULL DEFAULT 0,  -- 발급 시점의 총량 (이력용)
  source text,                    -- 'purchase' | 'promo' | 'admin_grant'
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_credits_user_action
  ON public.ai_credits (user_id, action);
CREATE INDEX IF NOT EXISTS idx_ai_credits_active
  ON public.ai_credits (user_id, action)
  WHERE remaining > 0;

DROP TRIGGER IF EXISTS ai_credits_touch_updated_at ON public.ai_credits;
CREATE TRIGGER ai_credits_touch_updated_at
  BEFORE UPDATE ON public.ai_credits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. 권한
GRANT ALL ON public.ai_usage TO service_role;
GRANT ALL ON public.ai_credits TO service_role;

-- 4. 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';
