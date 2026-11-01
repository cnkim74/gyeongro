-- ============================================================
-- 블로그 AI 자동 작성 (migration_blog.sql 실행 후)
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복사/붙여넣기 → Run
-- ============================================================

ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS cover_style text;          -- 대표 이미지 템플릿 색
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'; -- manual | ai
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS topic text;                -- AI에게 준 주제
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS naver_draft text;          -- 네이버 블로그용 원고
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS threads_text text;         -- 스레드 홍보 글
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS naver_posted boolean NOT NULL DEFAULT false;

NOTIFY pgrst, 'reload schema';
