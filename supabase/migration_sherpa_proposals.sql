-- ============================================================
-- 셰르파 제안 매칭 시스템 (Phase 1B)
-- ============================================================
-- 사용법: migration_sherpa.sql 실행 후 → 이 파일 실행
-- ============================================================
-- 흐름:
--   1. 여행자가 travel_plans 저장 후 'seeking_sherpa' 켬 (공개 매칭)
--   2. 셰르파가 공개 일정 둘러보고 sherpa_proposals 제출 (제안가 + 메시지)
--   3. 여행자가 제안 보고 승인 (status=accepted) → 다른 제안은 자동 declined
--   4. 결제는 추후 도입
-- ============================================================

-- 1. travel_plans에 매칭 관련 컬럼 추가
ALTER TABLE public.travel_plans
  ADD COLUMN IF NOT EXISTS seeking_sherpa boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sherpa_request_notes text,                -- 어떤 셰르파를 원하는지
  ADD COLUMN IF NOT EXISTS sherpa_required_languages text[],        -- 필요 언어
  ADD COLUMN IF NOT EXISTS sherpa_required_specialties text[],      -- 필요 분야
  ADD COLUMN IF NOT EXISTS sherpa_budget_max_krw int,               -- 셰르파 예산 한도
  ADD COLUMN IF NOT EXISTS accepted_proposal_id uuid,               -- 승인된 제안 (FK는 아래)
  ADD COLUMN IF NOT EXISTS open_at timestamptz,                     -- 매칭 공개 시각
  ADD COLUMN IF NOT EXISTS closed_at timestamptz;                   -- 매칭 종료 시각

CREATE INDEX IF NOT EXISTS idx_travel_plans_seeking_sherpa
  ON public.travel_plans (seeking_sherpa) WHERE seeking_sherpa = true;

-- 2. 셰르파 제안 테이블
CREATE TABLE IF NOT EXISTS public.sherpa_proposals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id uuid NOT NULL REFERENCES public.travel_plans(id) ON DELETE CASCADE,
  sherpa_id uuid NOT NULL REFERENCES public.sherpas(id) ON DELETE CASCADE,
  -- 제안 내용
  proposed_price_krw int NOT NULL,                  -- 셰르파가 제시한 총 가격
  proposed_scope text NOT NULL,                     -- 어디부터 어디까지 도와줄지 (예: "Day 2 종일 동행")
  message text NOT NULL,                            -- 셰르파의 어필 메시지
  available_dates daterange,                        -- 가능 날짜 범위 (선택)
  -- 상태
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn', 'expired')),
  declined_reason text,                             -- 여행자 사유 (선택)
  responded_at timestamptz,
  -- 메타
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- 한 셰르파가 한 여행에 한 번만
  CONSTRAINT sherpa_proposals_unique UNIQUE (trip_id, sherpa_id)
);

CREATE INDEX IF NOT EXISTS idx_sherpa_proposals_trip ON public.sherpa_proposals (trip_id);
CREATE INDEX IF NOT EXISTS idx_sherpa_proposals_sherpa ON public.sherpa_proposals (sherpa_id);
CREATE INDEX IF NOT EXISTS idx_sherpa_proposals_status ON public.sherpa_proposals (status);

-- 3. accepted_proposal_id FK 연결 (proposals 테이블 생성 후)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'travel_plans_accepted_proposal_fkey'
  ) THEN
    ALTER TABLE public.travel_plans
      ADD CONSTRAINT travel_plans_accepted_proposal_fkey
      FOREIGN KEY (accepted_proposal_id)
      REFERENCES public.sherpa_proposals(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 4. RLS
ALTER TABLE public.sherpa_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "proposals_read_participants" ON public.sherpa_proposals;
CREATE POLICY "proposals_read_participants"
  ON public.sherpa_proposals FOR SELECT
  USING (
    -- 여행 작성자
    auth.uid() IN (SELECT user_id FROM public.travel_plans WHERE id = trip_id)
    -- 또는 본인 제안
    OR auth.uid() IN (SELECT user_id FROM public.sherpas WHERE id = sherpa_id)
  );

-- 5. updated_at 자동 갱신
DROP TRIGGER IF EXISTS sherpa_proposals_touch_updated_at ON public.sherpa_proposals;
CREATE TRIGGER sherpa_proposals_touch_updated_at
  BEFORE UPDATE ON public.sherpa_proposals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 6. 승인 시 다른 제안 자동 declined 트리거
CREATE OR REPLACE FUNCTION public.reject_other_proposals_on_accept()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    UPDATE public.sherpa_proposals
       SET status = 'declined',
           declined_reason = '다른 제안이 승인됨',
           responded_at = now()
     WHERE trip_id = NEW.trip_id
       AND id <> NEW.id
       AND status = 'pending';

    -- 여행 측 accepted_proposal_id 갱신 + 매칭 종료
    UPDATE public.travel_plans
       SET accepted_proposal_id = NEW.id,
           seeking_sherpa = false,
           closed_at = now()
     WHERE id = NEW.trip_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sherpa_proposals_on_accept ON public.sherpa_proposals;
CREATE TRIGGER sherpa_proposals_on_accept
  AFTER UPDATE OF status ON public.sherpa_proposals
  FOR EACH ROW EXECUTE FUNCTION public.reject_other_proposals_on_accept();

-- 7. 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';
