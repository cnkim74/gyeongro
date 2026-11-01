-- ============================================================
-- Pothos 블로그 (여행 인사이트)
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복사/붙여넣기 → Run
-- 관리자 → '블로그 관리'에서 글 작성, /blog 에 공개
-- ============================================================

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,                 -- 주소 (/blog/<slug>)
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',          -- 요약 (목록·검색 결과에 표시)
  category text NOT NULL DEFAULT '',         -- 대표 해시태그 (예: 일본여행)
  cover_image_url text,                      -- 없으면 자동 디자인 커버
  content text NOT NULL DEFAULT '',          -- 본문 (마크다운)
  tags text[] NOT NULL DEFAULT '{}',
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,    -- [{ "q": "...", "a": "..." }]
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  author_id uuid REFERENCES next_auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts (is_published, published_at DESC);

DROP TRIGGER IF EXISTS blog_posts_touch_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_touch_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.blog_posts TO service_role;

NOTIFY pgrst, 'reload schema';
