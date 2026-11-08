-- ============================================================
-- Pothos 블로그 댓글 (공개 / 비밀) + 웹 푸시 알림 구독
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복사/붙여넣기 → Run
-- ============================================================

-- 1) 블로그 댓글 — 답글은 parent_id 로 한 단계만
--    is_private = 비밀 댓글: 쓴 사람 · 글쓴이(관리자)만 볼 수 있음
--    비밀 댓글에 달린 답글도 비밀 (원댓글 쓴 사람 · 관리자만)
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_private boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON public.blog_comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent ON public.blog_comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_recent ON public.blog_comments (created_at DESC);

DROP TRIGGER IF EXISTS blog_comments_touch_updated_at ON public.blog_comments;
CREATE TRIGGER blog_comments_touch_updated_at
  BEFORE UPDATE ON public.blog_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.blog_comments TO service_role;

-- 2) 웹 푸시 구독 (브라우저·기기마다 1줄)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.push_subscriptions TO service_role;

NOTIFY pgrst, 'reload schema';
