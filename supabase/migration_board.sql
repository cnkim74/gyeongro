-- ============================================================
-- 게시판 + 관리자 기능 마이그레이션
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복사/붙여넣기 → Run
-- ============================================================

-- ============================================================
-- 1. 게시글 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'free',
  view_count integer NOT NULL DEFAULT 0,
  is_pinned boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_is_deleted ON public.posts(is_deleted);

GRANT ALL ON public.posts TO service_role;

-- ============================================================
-- 2. 댓글 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at);

GRANT ALL ON public.comments TO service_role;

-- ============================================================
-- 3. updated_at 자동 갱신 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_updated_at ON public.posts;
CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS comments_updated_at ON public.comments;
CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 4. 첫 관리자 등록 (가장 먼저 가입한 사용자를 자동으로 관리자로)
-- 이미 admins 테이블이 schema.sql에서 생성되어 있어야 합니다
-- ============================================================
INSERT INTO public.admins (user_id)
SELECT id FROM next_auth.users
ORDER BY id
LIMIT 1
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- 5. 스키마 캐시 새로고침
-- ============================================================
NOTIFY pgrst, 'reload schema';
