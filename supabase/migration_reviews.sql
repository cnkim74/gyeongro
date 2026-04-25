-- ============================================================
-- 후기 게시판 마이그레이션
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복사/붙여넣기 → Run
-- ============================================================

-- 후기 테이블
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.travel_plans(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  destination text,
  is_deleted boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_is_featured ON public.reviews(is_featured) WHERE is_featured = true;

-- updated_at 자동 갱신 트리거 (set_updated_at 함수가 이미 존재한다고 가정)
DROP TRIGGER IF EXISTS reviews_updated_at ON public.reviews;
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT ALL ON public.reviews TO service_role;

-- 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';
