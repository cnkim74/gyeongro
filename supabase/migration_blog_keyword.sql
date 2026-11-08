-- ============================================================
-- 블로그 핵심 키워드 (검색 1페이지를 노리는 검색어)
-- ============================================================
-- 사용법: Supabase SQL Editor → 전체 복붙 → Run
-- ============================================================

ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS focus_keyword text;

NOTIFY pgrst, 'reload schema';
