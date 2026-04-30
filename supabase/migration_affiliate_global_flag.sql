-- ============================================================
-- 어필리에이트 상품 — 전체 페이지 노출 플래그 추가
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복붙 → Run
-- ============================================================

ALTER TABLE public.affiliate_products
  ADD COLUMN IF NOT EXISTS is_global boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.affiliate_products.is_global IS
  'true면 모든 공개 페이지의 푸터 위에 노출. 보통 1개 상품만 ON 권장.';

-- 인덱스 (전체 노출 상품 빠른 조회)
CREATE INDEX IF NOT EXISTS idx_affiliate_products_global
  ON public.affiliate_products (is_global)
  WHERE is_global = true AND is_active = true;

NOTIFY pgrst, 'reload schema';
