-- ============================================================
-- 이메일/비밀번호 가입 + 닉네임 + 아바타 프리셋 마이그레이션
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복사/붙여넣기 → Run
-- ============================================================

-- 1. 닉네임 컬럼 (nullable — 권장이지 필수 아님, 추후 OAuth 사용자도 설정 가능)
ALTER TABLE next_auth.users
  ADD COLUMN IF NOT EXISTS nickname text;

-- 닉네임 유니크 인덱스 (대소문자 무시, NULL 허용)
DROP INDEX IF EXISTS next_auth.users_nickname_lower_unique;
CREATE UNIQUE INDEX users_nickname_lower_unique
  ON next_auth.users (lower(nickname))
  WHERE nickname IS NOT NULL;

-- 닉네임 형식 제약 (한/영/숫자 2~12자) — DB 차원 가드, 클라/서버 검증과 이중 보호
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_nickname_format_check'
  ) THEN
    ALTER TABLE next_auth.users
      ADD CONSTRAINT users_nickname_format_check
        CHECK (
          nickname IS NULL OR
          (char_length(nickname) BETWEEN 2 AND 12 AND
           nickname ~ '^[A-Za-z0-9가-힣]+$')
        );
  END IF;
END $$;

-- 2. 비밀번호 해시 컬럼 (OAuth 가입자는 NULL, 이메일 가입자만 값 보유)
ALTER TABLE next_auth.users
  ADD COLUMN IF NOT EXISTS password_hash text;

-- 3. 아바타 프리셋 키 (예: "wanderer", "panda", ...). custom_image와 별개.
-- 우선순위: custom_image > avatar_preset > OAuth image
ALTER TABLE next_auth.users
  ADD COLUMN IF NOT EXISTS avatar_preset text;

-- 4. 가입 경로 추적 (선택) — credentials | google | naver | kakao
-- NextAuth accounts 테이블로도 알 수 있지만 빠른 조회용
ALTER TABLE next_auth.users
  ADD COLUMN IF NOT EXISTS signup_provider text;

-- 5. 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';
