-- ============================================================
-- 셰르파 (Sherpa) — 로컬 가이드 매칭 시스템 MVP
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복사/붙여넣기 → Run
-- ============================================================
-- 컨셉: 한국·해외 현지를 잘 아는 사람이 여행자를 도와주는 매칭 플랫폼
-- BM 단계: MVP는 매칭·예약 요청까지, 결제는 추후 (현재는 정산 오프라인)
-- ============================================================

-- 1. 셰르파 프로필
CREATE TABLE IF NOT EXISTS public.sherpas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE REFERENCES next_auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  tagline text,                              -- 한 줄 소개 (예: "10년차 도쿄 사진가")
  bio text NOT NULL,                         -- 자기소개 (1~3 문단)

  -- 활동 지역
  countries text[] NOT NULL,                 -- ISO codes ['KR', 'JP']
  cities text[] NOT NULL,                    -- ['서울', '도쿄']

  -- 언어 (ISO 639-1)
  languages text[] NOT NULL,                 -- ['ko', 'en', 'ja']

  -- 전문 분야 (하단 SHERPA_SPECIALTIES 참고)
  specialties text[] NOT NULL,

  -- 가격 (KRW 기준, 해외도 KRW 환산해서 표시)
  hourly_rate_krw int,
  half_day_rate_krw int,                     -- 4시간
  full_day_rate_krw int,                     -- 8시간

  avg_response_hours int,                    -- 평균 응답 시간 (예: 4)

  -- 미디어
  avatar_url text,
  cover_image_url text,
  gallery_urls text[],

  -- 검증 상태
  verified_id boolean NOT NULL DEFAULT false,        -- 신분증 확인 완료
  verified_local boolean NOT NULL DEFAULT false,     -- 현지 거주 확인
  verified_at timestamptz,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'published', 'rejected', 'paused')),
  rejection_reason text,
  reviewed_by uuid REFERENCES next_auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,

  -- 통계 (캐시)
  rating_avg numeric(3,2) DEFAULT 0,
  rating_count int NOT NULL DEFAULT 0,
  booking_count int NOT NULL DEFAULT 0,
  view_count int NOT NULL DEFAULT 0,

  -- 정책 동의
  agreed_terms_at timestamptz,
  agreed_pricing_at timestamptz,

  display_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sherpas_status ON public.sherpas (status);
CREATE INDEX IF NOT EXISTS idx_sherpas_countries ON public.sherpas USING gin (countries);
CREATE INDEX IF NOT EXISTS idx_sherpas_cities ON public.sherpas USING gin (cities);
CREATE INDEX IF NOT EXISTS idx_sherpas_languages ON public.sherpas USING gin (languages);
CREATE INDEX IF NOT EXISTS idx_sherpas_specialties ON public.sherpas USING gin (specialties);
CREATE INDEX IF NOT EXISTS idx_sherpas_rating ON public.sherpas (rating_avg DESC);

-- 2. 셰르파 예약/문의
CREATE TABLE IF NOT EXISTS public.sherpa_bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sherpa_id uuid NOT NULL REFERENCES public.sherpas(id) ON DELETE CASCADE,
  client_id uuid REFERENCES next_auth.users(id) ON DELETE SET NULL,

  -- 여행 정보
  destination_city text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  duration_type text NOT NULL CHECK (duration_type IN ('hourly', 'half_day', 'full_day', 'multi_day')),
  duration_hours int,                         -- 'hourly' 일 때만
  party_size int NOT NULL DEFAULT 1,

  -- 요청
  notes text NOT NULL,                        -- 어떤 도움이 필요한지
  preferred_language text,                    -- 'ko' | 'en' ...
  preferred_specialties text[],               -- 원하는 분야

  -- 연락처
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  contact_messenger text,                     -- 카톡 등

  -- 가격
  estimated_price_krw int,                    -- 시스템 자동 계산
  agreed_price_krw int,                       -- 셰르파 응답 후 확정

  -- 상태
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed', 'expired')),
  sherpa_message text,                        -- 셰르파 응답 메시지
  declined_reason text,
  responded_at timestamptz,
  completed_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sherpa_bookings_sherpa ON public.sherpa_bookings (sherpa_id);
CREATE INDEX IF NOT EXISTS idx_sherpa_bookings_client ON public.sherpa_bookings (client_id);
CREATE INDEX IF NOT EXISTS idx_sherpa_bookings_status ON public.sherpa_bookings (status);

-- 3. RLS
ALTER TABLE public.sherpas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sherpa_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sherpas_read_published" ON public.sherpas;
CREATE POLICY "sherpas_read_published"
  ON public.sherpas FOR SELECT
  USING (status = 'published' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "sherpa_bookings_read_own" ON public.sherpa_bookings;
CREATE POLICY "sherpa_bookings_read_own"
  ON public.sherpa_bookings FOR SELECT
  USING (
    auth.uid() = client_id
    OR auth.uid() IN (SELECT user_id FROM public.sherpas WHERE id = sherpa_id)
  );

-- 4. updated_at 자동 갱신
DROP TRIGGER IF EXISTS sherpas_touch_updated_at ON public.sherpas;
CREATE TRIGGER sherpas_touch_updated_at
  BEFORE UPDATE ON public.sherpas
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS sherpa_bookings_touch_updated_at ON public.sherpa_bookings;
CREATE TRIGGER sherpa_bookings_touch_updated_at
  BEFORE UPDATE ON public.sherpa_bookings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5. 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';
