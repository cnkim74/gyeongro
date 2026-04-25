-- ============================================================
-- 프로필 사진 업로드 기능 추가 마이그레이션
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복사/붙여넣기 → Run
-- ============================================================

-- 1. next_auth.users에 custom_image 컬럼 추가 (구글/네이버/카카오 기본 이미지 위에 덮어쓸 사진 URL)
ALTER TABLE next_auth.users
  ADD COLUMN IF NOT EXISTS custom_image text;

-- 2. Storage 버킷 생성 (avatars - 공개 읽기, 인증된 사용자만 쓰기)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 3. Storage RLS 정책 (avatars 버킷)
-- 누구나 읽기 가능 (공개)
DROP POLICY IF EXISTS "Public avatars are readable" ON storage.objects;
CREATE POLICY "Public avatars are readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- service_role은 모든 작업 가능 (서버에서 service_role 키로 업로드)
-- (service_role은 RLS 자동 우회하므로 별도 정책 불필요)

-- 4. 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';
