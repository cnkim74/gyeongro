-- ============================================================
-- 장소 좌표 캐시 (Google Places) — 지도 기능
-- ============================================================
-- 사용법: Supabase SQL Editor → 전체 복붙 → Run
-- ============================================================
-- Google Maps Platform 약관:
--   - place_id 는 기한 없이 저장 가능
--   - lat/lng 는 최대 30일까지만 캐시 (앱에서 updated_at 기준 29일 지나면 재조회)
--   - 평점·리뷰·사진 등 장소 콘텐츠는 저장하지 않음
-- 이 테이블이 없어도 지도는 동작함 (캐시만 안 됨)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.place_cache (
  query_key  text PRIMARY KEY,          -- 정규화된 검색어 (장소명 + 도시)
  place_id   text,                      -- Google place ID (못 찾으면 NULL)
  lat        double precision,
  lng        double precision,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 서버(service role)만 접근 — 일반 사용자 접근 차단
ALTER TABLE public.place_cache ENABLE ROW LEVEL SECURITY;
