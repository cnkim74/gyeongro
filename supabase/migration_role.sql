-- ============================================================
-- 사용자 권한 등급 (role) 마이그레이션
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복사/붙여넣기 → Run
-- ============================================================

-- 1. role 컬럼 추가 (기본값: user)
ALTER TABLE next_auth.users
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- 2. 유효한 값 제약 (user / business / admin)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE next_auth.users
      ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'business', 'admin'));
  END IF;
END $$;

-- 3. 기존 admins 테이블의 사용자들을 role='admin'으로 마이그레이션
UPDATE next_auth.users
SET role = 'admin'
WHERE id IN (SELECT user_id FROM public.admins);

-- 4. 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';
