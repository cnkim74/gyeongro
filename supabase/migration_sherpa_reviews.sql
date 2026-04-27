-- ============================================================
-- 셰르파 후기·평점 시스템
-- ============================================================
-- 사용법: Supabase SQL Editor → 전체 복붙 → Run
-- ============================================================
-- 흐름:
--   1. 매칭 완료(booking 'completed' 또는 proposal 'accepted' + 종료일 지남) 후
--      여행자가 후기 작성 (rating 1~5 + comment 필수)
--   2. 셰르파는 후기에 답글 달 수 있음 (선택)
--   3. 트리거가 sherpas.rating_avg / rating_count 자동 갱신
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sherpa_reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sherpa_id uuid NOT NULL REFERENCES public.sherpas(id) ON DELETE CASCADE,
  client_id uuid REFERENCES next_auth.users(id) ON DELETE SET NULL,

  -- 출처 (booking 또는 proposal 중 하나)
  booking_id uuid UNIQUE REFERENCES public.sherpa_bookings(id) ON DELETE CASCADE,
  proposal_id uuid UNIQUE REFERENCES public.sherpa_proposals(id) ON DELETE CASCADE,

  -- 여행자 평가 (필수)
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL CHECK (char_length(comment) >= 10),

  -- 셰르파 응답 (선택)
  sherpa_reply text,
  sherpa_replied_at timestamptz,

  status text NOT NULL DEFAULT 'visible'
    CHECK (status IN ('visible', 'hidden', 'reported')),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- booking 또는 proposal 중 최소 하나
  CONSTRAINT review_source_required CHECK (
    booking_id IS NOT NULL OR proposal_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_sherpa_reviews_sherpa
  ON public.sherpa_reviews (sherpa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sherpa_reviews_client
  ON public.sherpa_reviews (client_id);
CREATE INDEX IF NOT EXISTS idx_sherpa_reviews_status
  ON public.sherpa_reviews (status);

-- RLS
ALTER TABLE public.sherpa_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_read_visible" ON public.sherpa_reviews;
CREATE POLICY "reviews_read_visible"
  ON public.sherpa_reviews FOR SELECT
  USING (status = 'visible'
    OR auth.uid() = client_id
    OR auth.uid() IN (SELECT user_id FROM public.sherpas WHERE id = sherpa_id));

-- updated_at 트리거
DROP TRIGGER IF EXISTS sherpa_reviews_touch ON public.sherpa_reviews;
CREATE TRIGGER sherpa_reviews_touch
  BEFORE UPDATE ON public.sherpa_reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 후기 변경 시 sherpas 집계 자동 갱신
CREATE OR REPLACE FUNCTION public.recompute_sherpa_rating()
RETURNS trigger AS $$
DECLARE
  target_id uuid;
BEGIN
  target_id := COALESCE(NEW.sherpa_id, OLD.sherpa_id);
  UPDATE public.sherpas
  SET
    rating_count = (
      SELECT COUNT(*) FROM public.sherpa_reviews
       WHERE sherpa_id = target_id AND status = 'visible'
    ),
    rating_avg = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2) FROM public.sherpa_reviews
       WHERE sherpa_id = target_id AND status = 'visible'
    ), 0)
  WHERE id = target_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sherpa_reviews_aggregate ON public.sherpa_reviews;
CREATE TRIGGER sherpa_reviews_aggregate
  AFTER INSERT OR UPDATE OR DELETE ON public.sherpa_reviews
  FOR EACH ROW EXECUTE FUNCTION public.recompute_sherpa_rating();

NOTIFY pgrst, 'reload schema';
