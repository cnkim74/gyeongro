-- ============================================================
-- 비회원 댓글 (블로그 · 스토리 · 게시판)
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복사/붙여넣기 → Run
-- - 회원 댓글은 그대로, 비회원 댓글은 user_id 없이 이름·비밀번호(암호화)·이메일(선택)로 저장
-- - IP 는 원문이 아니라 해시만 저장 (스팸 방지용)
-- ============================================================

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['blog_comments', 'story_comments', 'comments'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id DROP NOT NULL', t);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS guest_name text', t);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS guest_password_hash text', t);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS guest_email text', t);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS guest_token text', t);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS ip_hash text', t);
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (ip_hash, created_at)', 'idx_' || t || '_ip', t);
    END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
