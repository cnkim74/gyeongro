-- ============================================================
-- 셰르파 ↔ 여행자 DM (메시지 스레드)
-- ============================================================
-- 사용법: Supabase SQL Editor → 전체 복붙 → Run
-- ============================================================
-- 컨셉:
--   - 각 메시지는 booking_id 또는 proposal_id에 속함 (스레드 키)
--   - 발신자 = traveler 또는 sherpa
--   - 실시간 채팅 X, 페이지 갱신/폴링 기반
--   - 새 메시지 시 상대방에게 이메일 알림
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sherpa_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 스레드 키 (둘 중 하나)
  booking_id uuid REFERENCES public.sherpa_bookings(id) ON DELETE CASCADE,
  proposal_id uuid REFERENCES public.sherpa_proposals(id) ON DELETE CASCADE,

  -- 발신자
  sender_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE SET NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('traveler', 'sherpa')),

  body text NOT NULL CHECK (
    char_length(body) >= 1 AND char_length(body) <= 4000
  ),

  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT message_thread_required CHECK (
    booking_id IS NOT NULL OR proposal_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_sherpa_messages_booking
  ON public.sherpa_messages (booking_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sherpa_messages_proposal
  ON public.sherpa_messages (proposal_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sherpa_messages_sender
  ON public.sherpa_messages (sender_id);

-- RLS: 본인이 참여한 스레드만 조회
ALTER TABLE public.sherpa_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_read_participants" ON public.sherpa_messages;
CREATE POLICY "messages_read_participants"
  ON public.sherpa_messages FOR SELECT
  USING (
    -- booking 스레드: 본인이 client 또는 sherpa 소유자
    (booking_id IS NOT NULL AND (
      auth.uid() IN (SELECT client_id FROM public.sherpa_bookings WHERE id = booking_id)
      OR auth.uid() IN (
        SELECT s.user_id FROM public.sherpas s
         JOIN public.sherpa_bookings b ON b.sherpa_id = s.id
         WHERE b.id = booking_id
      )
    ))
    OR
    -- proposal 스레드: 본인이 trip 소유자 또는 sherpa 소유자
    (proposal_id IS NOT NULL AND (
      auth.uid() IN (
        SELECT t.user_id FROM public.travel_plans t
         JOIN public.sherpa_proposals p ON p.trip_id = t.id
         WHERE p.id = proposal_id
      )
      OR auth.uid() IN (
        SELECT s.user_id FROM public.sherpas s
         JOIN public.sherpa_proposals p ON p.sherpa_id = s.id
         WHERE p.id = proposal_id
      )
    ))
  );

NOTIFY pgrst, 'reload schema';
