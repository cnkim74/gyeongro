-- ============================================================
-- 해외 축제 (AI 큐레이션 + 관리자 검수)
-- ============================================================
-- 사용법: Supabase SQL Editor → 전체 복붙 → Run
-- 관리자 '해외 축제 큐레이션'에서 AI 가 웹 검색으로 찾은 후보를 pending 으로 저장 →
-- 관리자가 확인 후 published 로 바꾸면 축제 페이지 '세계 대표 축제'에 표시
-- ============================================================

CREATE TABLE IF NOT EXISTS public.global_festivals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                 -- 한글 이름
  name_en text,                       -- 영문(현지) 이름
  country text NOT NULL,              -- 한글 나라 이름
  flag text,                          -- 국기 이모지
  city text NOT NULL,                 -- 개최 도시
  destination text NOT NULL,          -- 플래너 목적지 (가까운 여행 도시)
  start_date date,                    -- 올해(또는 다음) 개최 시작일
  end_date date,
  months integer[] NOT NULL DEFAULT '{}',
  period text,                        -- 표시용 기간 문구
  summary text,
  emoji text,
  source_url text,                    -- 개최일 확인 출처
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'published', 'rejected')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_global_festivals_status_date
  ON public.global_festivals (status, start_date);

ALTER TABLE public.global_festivals ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.global_festivals TO service_role;

NOTIFY pgrst, 'reload schema';
