-- ============================================================
-- 여행 파트너 + 스토리 마이그레이션
-- ============================================================

-- updated_at 함수 (있으면 무시)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. 여행 파트너 모집
-- ============================================================
CREATE TABLE IF NOT EXISTS public.partner_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  destination text NOT NULL,
  start_date date,
  end_date date,
  max_people integer NOT NULL DEFAULT 2,
  current_people integer NOT NULL DEFAULT 1,
  gender_pref text,
  age_range text,
  budget_text text,
  contact_method text,
  status text NOT NULL DEFAULT 'open',
  view_count integer NOT NULL DEFAULT 0,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT partner_status_check CHECK (status IN ('open', 'closed', 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_partner_posts_status ON public.partner_posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_posts_user_id ON public.partner_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_posts_destination ON public.partner_posts(destination);

DROP TRIGGER IF EXISTS partner_posts_updated_at ON public.partner_posts;
CREATE TRIGGER partner_posts_updated_at
  BEFORE UPDATE ON public.partner_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT ALL ON public.partner_posts TO service_role;

-- ============================================================
-- 2. 파트너 신청
-- ============================================================
CREATE TABLE IF NOT EXISTS public.partner_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.partner_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  CONSTRAINT unique_application UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_apps_post_id ON public.partner_applications(post_id);
CREATE INDEX IF NOT EXISTS idx_partner_apps_user_id ON public.partner_applications(user_id);

DROP TRIGGER IF EXISTS partner_apps_updated_at ON public.partner_applications;
CREATE TRIGGER partner_apps_updated_at
  BEFORE UPDATE ON public.partner_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT ALL ON public.partner_applications TO service_role;

-- ============================================================
-- 3. 독창적 여행 스토리
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subtitle text,
  destination text,
  cover_image_url text,
  intro text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags text[],
  duration_text text,
  is_published boolean NOT NULL DEFAULT true,
  is_deleted boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0,
  like_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_published
  ON public.stories(is_published, is_deleted, created_at DESC)
  WHERE is_published = true AND is_deleted = false;

DROP TRIGGER IF EXISTS stories_updated_at ON public.stories;
CREATE TRIGGER stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT ALL ON public.stories TO service_role;

-- ============================================================
-- 4. 스토리 좋아요 (선택)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.story_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_story_like UNIQUE (story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_story_likes_story_id ON public.story_likes(story_id);
GRANT ALL ON public.story_likes TO service_role;

-- 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';
