-- ============================================================
-- 사용자 역할 확장 — sherpa 추가
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복사/붙여넣기 → Run
-- ============================================================
-- 기존 role: 'user' / 'business' / 'admin'
-- 추가:      'sherpa'
--
-- 정책: DB enum 값은 internal 식별자이므로 그대로 유지하고,
--       사용자에게 보이는 라벨은 src/lib/admin.ts에서 매핑합니다.
--         user     → "여행자"
--         business → "파트너"
--         sherpa   → "셰르파"  (신규)
--         admin    → "운영팀"
-- ============================================================

-- 1. CHECK 제약 갱신 (sherpa 추가)
ALTER TABLE next_auth.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE next_auth.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'business', 'sherpa', 'admin'));

-- 2. 기존 셰르파(public.sherpas published)들을 sherpa role로 백필
UPDATE next_auth.users u
   SET role = 'sherpa'
  FROM public.sherpas s
 WHERE s.user_id = u.id
   AND s.status = 'published'
   AND u.role = 'user';   -- admin / business는 보존

-- 3. 인덱스 (역할 기반 카운트·필터 빈번해질 예정)
CREATE INDEX IF NOT EXISTS idx_users_role
  ON next_auth.users (role);

-- 4. 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';
