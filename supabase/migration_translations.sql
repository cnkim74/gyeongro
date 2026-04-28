-- ============================================================
-- 다국어 자동 번역 (Step 7)
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복붙 → Run
-- 재실행 안전 (IF NOT EXISTS / DO NOTHING)
--
-- 정책:
--   - 한국어를 마스터 텍스트로 두고 영(_en)/일(_ja)/중(_zh) 자동 생성
--   - 번역은 Gemini Flash 사용 (빠름·저렴)
--   - 동일 텍스트는 translations 캐시 테이블에서 재사용 (LLM 호출 절약)
--   - 폴백: 대상 언어 컬럼이 NULL/빈문자열이면 한국어 원문 노출
-- ============================================================

-- 1. 번역 캐시 테이블 (전체 모듈 공통)
CREATE TABLE IF NOT EXISTS public.translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_hash text NOT NULL,        -- 원문 sha256(source_text + source_lang) 일부
  source_lang text NOT NULL DEFAULT 'ko',
  target_lang text NOT NULL,        -- 'en' | 'ja' | 'zh'
  source_text text NOT NULL,
  translated_text text NOT NULL,
  model text,                       -- 'gemini-2.0-flash' 등
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_hash, source_lang, target_lang)
);

CREATE INDEX IF NOT EXISTS idx_translations_lookup
  ON public.translations (source_hash, source_lang, target_lang);

GRANT ALL ON public.translations TO service_role;

-- 2. sherpas 테이블에 _ja / _zh 컬럼 추가 (이미 _en 있음)
ALTER TABLE public.sherpas
  ADD COLUMN IF NOT EXISTS tagline_ja text,
  ADD COLUMN IF NOT EXISTS tagline_zh text,
  ADD COLUMN IF NOT EXISTS bio_ja text,
  ADD COLUMN IF NOT EXISTS bio_zh text,
  ADD COLUMN IF NOT EXISTS cities_ja text[],
  ADD COLUMN IF NOT EXISTS cities_zh text[];

-- 3. medical_clinics 테이블 _ja / _zh
ALTER TABLE public.medical_clinics
  ADD COLUMN IF NOT EXISTS name_ja text,
  ADD COLUMN IF NOT EXISTS name_zh text,
  ADD COLUMN IF NOT EXISTS description_ja text,
  ADD COLUMN IF NOT EXISTS description_zh text,
  ADD COLUMN IF NOT EXISTS specialties_ja text[],
  ADD COLUMN IF NOT EXISTS specialties_zh text[],
  ADD COLUMN IF NOT EXISTS city_ja text,
  ADD COLUMN IF NOT EXISTS city_zh text;

-- 4. curated_themes 테이블 _en / _ja / _zh
ALTER TABLE public.curated_themes
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS title_ja text,
  ADD COLUMN IF NOT EXISTS title_zh text,
  ADD COLUMN IF NOT EXISTS subtitle_en text,
  ADD COLUMN IF NOT EXISTS subtitle_ja text,
  ADD COLUMN IF NOT EXISTS subtitle_zh text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS description_ja text,
  ADD COLUMN IF NOT EXISTS description_zh text;

-- 5. 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';
