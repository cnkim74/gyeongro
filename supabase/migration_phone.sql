-- ============================================================
-- 휴대전화번호 컬럼 추가 마이그레이션
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복사/붙여넣기 → Run
-- ============================================================

-- next_auth.users에 phone 컬럼 추가
ALTER TABLE next_auth.users
  ADD COLUMN IF NOT EXISTS phone text;

-- 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';
