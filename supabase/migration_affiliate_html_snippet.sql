-- ============================================================
-- 어필리에이트 상품에 HTML 스니펫 컬럼 추가 (쿠팡 다이나믹 배너용)
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복붙 → Run
--
-- 정책:
-- - 쿠팡 파트너스에서 발급한 iframe·HTML 스니펫을 그대로 저장
-- - 관리자가 입력한 HTML만 받음 (admin-only)
-- - 렌더링 시 정해진 도메인의 iframe만 허용 (서버 검증)
-- ============================================================

ALTER TABLE public.affiliate_products
  ADD COLUMN IF NOT EXISTS html_snippet text;

COMMENT ON COLUMN public.affiliate_products.html_snippet IS
  '쿠팡 파트너스 등에서 발급한 HTML 배너 (iframe·a 태그). NULL이면 카드형 자동 렌더링.';

NOTIFY pgrst, 'reload schema';
