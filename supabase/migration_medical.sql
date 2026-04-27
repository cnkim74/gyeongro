-- ============================================================
-- 의료관광 (Medical Tourism) 마이그레이션
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복사/붙여넣기 → Run
-- ============================================================
-- 포지셔닝: "정보 큐레이션 미디어" (의료법 알선·유인 회피)
--   - 직접 예약/결제 X
--   - 견적 요청 = 사용자가 클리닉에 직접 연락하도록 정보 제공
--   - 광고가 아닌 큐레이팅된 정보 게시 형태
-- ============================================================

-- 1. 시술 카테고리
CREATE TABLE IF NOT EXISTS public.medical_procedures (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text NOT NULL UNIQUE,                -- 'plastic-surgery' | 'health-checkup' | 'hair-transplant'
  name_ko text NOT NULL,                    -- '성형' | '건강검진' | '모발이식'
  name_en text,                             -- 'Plastic Surgery' (Inbound용)
  emoji text,                               -- '✨' | '🩺' | '💇'
  description text,
  recovery_days int,                        -- 평균 회복 기간 (일)
  cover_image_url text,
  display_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. 클리닉 / 병원
CREATE TABLE IF NOT EXISTS public.medical_clinics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,                       -- 클리닉명 (한글)
  name_en text,                             -- 영문명
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  -- inbound: 외국인이 한국으로 옴 (예: 강남 성형외과)
  -- outbound: 한국인이 해외로 감 (예: 터키 모발이식 클리닉)
  country text NOT NULL,                    -- 'KR' | 'TR' | 'TH' ...
  city text NOT NULL,
  procedures jsonb NOT NULL DEFAULT '[]'::jsonb,  -- procedure slug 배열 ['plastic-surgery', ...]
  specialties text[],                       -- 세부 시술 ['모발이식 FUE', '코 성형']
  description text,
  highlights text[],                        -- 강점 bullet ['10년 경력', '한국어 통역', '24시간 응급']
  price_range_min int,                      -- KRW
  price_range_max int,                      -- KRW
  contact_phone text,
  contact_email text,
  contact_kakao text,                       -- 카카오톡 채널 ID
  contact_whatsapp text,                    -- 인바운드용
  website_url text,
  cover_image_url text,
  gallery_urls text[],                      -- 클리닉 내부/before-after (인물 사진은 동의 필요)
  address text,
  lat double precision,
  lon double precision,
  source text NOT NULL DEFAULT 'user_submitted'
    CHECK (source IN ('ai_curated', 'user_submitted', 'verified_partner')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'published', 'rejected', 'archived')),
  submitted_by uuid REFERENCES next_auth.users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES next_auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text,
  view_count int NOT NULL DEFAULT 0,
  inquiry_count int NOT NULL DEFAULT 0,
  display_order int DEFAULT 0,
  ai_notes text,                            -- AI 큐레이션 시 출처/이유 메모
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medical_clinics_status ON public.medical_clinics (status);
CREATE INDEX IF NOT EXISTS idx_medical_clinics_direction ON public.medical_clinics (direction);
CREATE INDEX IF NOT EXISTS idx_medical_clinics_country ON public.medical_clinics (country);
CREATE INDEX IF NOT EXISTS idx_medical_clinics_procedures ON public.medical_clinics USING gin (procedures);

-- 3. 견적/상담 문의
CREATE TABLE IF NOT EXISTS public.medical_inquiries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES public.medical_clinics(id) ON DELETE SET NULL,
  procedure_slug text,
  -- 일반 견적 (사용자가 클리닉 미선택, 운영자에게 추천 요청) 시 clinic_id NULL
  user_id uuid REFERENCES next_auth.users(id) ON DELETE SET NULL,
  -- 익명 가능 (의료 정보 민감성)
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  contact_messenger text,                   -- 카카오톡 ID 등
  preferred_contact text DEFAULT 'email'
    CHECK (preferred_contact IN ('email', 'phone', 'kakao', 'whatsapp')),
  preferred_date date,
  budget_krw int,
  notes text NOT NULL,                      -- 시술 희망사항
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'forwarded', 'responded', 'closed')),
  -- 운영자가 클리닉에 전달했는지 여부 (실제 전달은 사람이)
  internal_memo text,                       -- 운영자 메모
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medical_inquiries_status ON public.medical_inquiries (status);
CREATE INDEX IF NOT EXISTS idx_medical_inquiries_clinic ON public.medical_inquiries (clinic_id);
CREATE INDEX IF NOT EXISTS idx_medical_inquiries_created ON public.medical_inquiries (created_at DESC);

-- 4. RLS
ALTER TABLE public.medical_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_inquiries ENABLE ROW LEVEL SECURITY;

-- procedures: 누구나 읽기, 관리자만 수정
DROP POLICY IF EXISTS "procedures_read_all" ON public.medical_procedures;
CREATE POLICY "procedures_read_all"
  ON public.medical_procedures FOR SELECT
  USING (true);

-- clinics: published 만 누구나 읽기, 본인 제출 건은 본인이 읽기, 관리자는 모두
DROP POLICY IF EXISTS "clinics_read_published" ON public.medical_clinics;
CREATE POLICY "clinics_read_published"
  ON public.medical_clinics FOR SELECT
  USING (status = 'published');

-- inquiries: 본인 것만 읽기 (운영자는 service_role로 접근)
DROP POLICY IF EXISTS "inquiries_read_own" ON public.medical_inquiries;
CREATE POLICY "inquiries_read_own"
  ON public.medical_inquiries FOR SELECT
  USING (auth.uid() = user_id);

-- 모든 쓰기는 service_role(API)을 통해서만 (RLS bypass)

-- 5. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clinics_touch_updated_at ON public.medical_clinics;
CREATE TRIGGER clinics_touch_updated_at
  BEFORE UPDATE ON public.medical_clinics
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 6. 기본 시술 카테고리 시드 (idempotent)
INSERT INTO public.medical_procedures (slug, name_ko, name_en, emoji, description, recovery_days, display_order)
VALUES
  ('plastic-surgery', '성형', 'Plastic Surgery',
   '✨',
   '얼굴·체형·피부 시술. 한국은 정밀도와 트렌드 면에서 세계적 수준이며, 강남·대구 등 주요 클러스터가 형성되어 있습니다.',
   7, 1),
  ('health-checkup', '건강검진', 'Health Checkup',
   '🩺',
   '종합검진·암 정밀검사·심뇌혈관 검진. 한국 검진센터는 짧은 대기·고해상 장비로 외국인 환자에게 인기가 높습니다.',
   2, 2),
  ('hair-transplant', '모발이식', 'Hair Transplant',
   '💇',
   'FUE·DHI·로봇이식 등. 터키 이스탄불, 헝가리 부다페스트, 한국 강남이 가격·기술 측면에서 주요 거점입니다.',
   10, 3)
ON CONFLICT (slug) DO UPDATE
  SET name_ko = EXCLUDED.name_ko,
      name_en = EXCLUDED.name_en,
      emoji = EXCLUDED.emoji,
      description = EXCLUDED.description,
      recovery_days = EXCLUDED.recovery_days,
      display_order = EXCLUDED.display_order;

-- 7. 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';
