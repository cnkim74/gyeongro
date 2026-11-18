-- ============================================================
-- 해외 축제·박람회 대표 사진 (위키미디어 공용 자유 이용 사진 + 출처)
-- ============================================================
-- 사용법: Supabase SQL Editor → 전체 복붙 → Run
-- ============================================================

ALTER TABLE public.global_festivals ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.global_festivals ADD COLUMN IF NOT EXISTS image_credit text;
ALTER TABLE public.global_festivals ADD COLUMN IF NOT EXISTS image_credit_url text;

NOTIFY pgrst, 'reload schema';
