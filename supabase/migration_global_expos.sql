-- ============================================================
-- 박람회 큐레이션 (migration_global_festivals.sql 실행 후)
-- ============================================================
-- 사용법: Supabase SQL Editor → 전체 복붙 → Run
-- 축제와 같은 표(global_festivals)에 '종류'와 '관람 대상'만 추가
-- ============================================================

ALTER TABLE public.global_festivals ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'festival';  -- festival | expo
ALTER TABLE public.global_festivals ADD COLUMN IF NOT EXISTS audience text;  -- 박람회: public(일반 관람) | trade(업계 전용) | mixed(일부 일반 공개)

CREATE INDEX IF NOT EXISTS idx_global_festivals_kind ON public.global_festivals (kind, status, start_date);

NOTIFY pgrst, 'reload schema';
