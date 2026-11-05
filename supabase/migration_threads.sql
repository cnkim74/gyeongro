-- ============================================================
-- 스레드 자동 게시 기록 (migration_blog_auto.sql 실행 후)
-- ============================================================
-- 사용법: Supabase SQL Editor → 전체 복붙 → Run
-- ============================================================

ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS threads_posted_at timestamptz;  -- 스레드에 올린 시각
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS threads_post_id text;           -- 스레드 게시물 id

NOTIFY pgrst, 'reload schema';
