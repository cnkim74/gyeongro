-- ============================================================
-- 기업회원(길잡이) 정보 마이그레이션
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복사/붙여넣기 → Run
-- ============================================================

-- 1. 기업회원 정보 컬럼 추가
ALTER TABLE next_auth.users
  ADD COLUMN IF NOT EXISTS business_name text;

ALTER TABLE next_auth.users
  ADD COLUMN IF NOT EXISTS business_category text;

-- 2. 스폰서십(광고/홍보) 테이블
CREATE TABLE IF NOT EXISTS public.sponsorships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  image_url text,
  link_url text,
  destination text,
  status text NOT NULL DEFAULT 'pending', -- pending / approved / rejected / expired
  starts_at timestamptz,
  ends_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  click_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sponsorships_user_id ON public.sponsorships(user_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_status ON public.sponsorships(status);
CREATE INDEX IF NOT EXISTS idx_sponsorships_active
  ON public.sponsorships(status, starts_at, ends_at)
  WHERE status = 'approved';

DROP TRIGGER IF EXISTS sponsorships_updated_at ON public.sponsorships;
CREATE TRIGGER sponsorships_updated_at
  BEFORE UPDATE ON public.sponsorships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT ALL ON public.sponsorships TO service_role;

-- 3. 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';
