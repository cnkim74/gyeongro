-- ============================================================
-- 다중 게시판 마이그레이션
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복사/붙여넣기 → Run
-- ============================================================

-- 1. boards 테이블 (게시판 정의)
CREATE TABLE IF NOT EXISTS public.boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  is_admin_only boolean NOT NULL DEFAULT false,
  post_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boards_published ON public.boards(is_published, display_order);

DROP TRIGGER IF EXISTS boards_updated_at ON public.boards;
CREATE TRIGGER boards_updated_at
  BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT ALL ON public.boards TO service_role;

-- 2. posts에 board_id 컬럼 추가
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS board_id uuid REFERENCES public.boards(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_posts_board_id ON public.posts(board_id);

-- 3. 기본 게시판 4개 시드
INSERT INTO public.boards (slug, name, description, icon, display_order, is_admin_only)
VALUES
  ('notice', '공지사항', '경로의 중요 공지를 확인하세요', '📢', 0, true),
  ('free', '자유게시판', '여행자들의 자유로운 수다', '💬', 1, false),
  ('tip', '여행 팁', '꿀팁과 노하우를 공유해요', '💡', 2, false),
  ('question', '질문답변', '여행 관련 궁금증을 해결해요', '❓', 3, false)
ON CONFLICT (slug) DO NOTHING;

-- 4. 기존 posts의 category → 해당 board_id 로 매핑
UPDATE public.posts
SET board_id = (SELECT id FROM public.boards WHERE slug = 'free')
WHERE board_id IS NULL AND (category IS NULL OR category = 'free');

UPDATE public.posts
SET board_id = (SELECT id FROM public.boards WHERE slug = 'tip')
WHERE board_id IS NULL AND category = 'tip';

UPDATE public.posts
SET board_id = (SELECT id FROM public.boards WHERE slug = 'question')
WHERE board_id IS NULL AND category = 'question';

UPDATE public.posts
SET board_id = (SELECT id FROM public.boards WHERE slug = 'free')
WHERE board_id IS NULL;

-- 5. post_count 초기 계산
UPDATE public.boards b
SET post_count = (
  SELECT COUNT(*) FROM public.posts p
  WHERE p.board_id = b.id AND p.is_deleted = false
);

-- 6. 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';
