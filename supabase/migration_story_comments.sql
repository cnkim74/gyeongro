-- ============================================================
-- Pothos 스토리 댓글 (공개 / 비밀) — 블로그 댓글과 같은 구조
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복사/붙여넣기 → Run
-- (웹 푸시 구독 표는 migration_blog_comments.sql 에서 이미 만들어요)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.story_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.story_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_private boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_story_comments_post ON public.story_comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_story_comments_parent ON public.story_comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_recent ON public.story_comments (created_at DESC);

DROP TRIGGER IF EXISTS story_comments_touch_updated_at ON public.story_comments;
CREATE TRIGGER story_comments_touch_updated_at
  BEFORE UPDATE ON public.story_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.story_comments TO service_role;

NOTIFY pgrst, 'reload schema';
