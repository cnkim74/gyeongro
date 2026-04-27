// 통합 검색 API — 셰르파 + 의료 클리닉 + 큐레이티드 테마
//
// GET /api/search
//   q          검색어 (1자 이상)
//   type       all | sherpa | clinic | theme   (기본 all)
//   country    KR,JP   (콤마)
//   city       Seoul
//   language   ko,en   (셰르파)
//   specialty  city_guide,food_tour
//   direction  inbound | outbound     (클리닉)
//   category   string                 (테마)
//   minPrice / maxPrice   int (KRW, 셰르파 hourly_rate_krw)
//   minRating  number 0~5             (셰르파)
//   sort       relevance | rating | price_asc | price_desc | newest
//   page       1-based, 기본 1
//   pageSize   기본 12, 최대 24
//   suggest    1 → 자동완성 모드 (각 타입별 4개)

import { performSearch, type SearchType, type SortKey } from "@/lib/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const direction = url.searchParams.get("direction");
  const result = await performSearch({
    q: url.searchParams.get("q") ?? "",
    type: (url.searchParams.get("type") ?? "all") as SearchType,
    countries: parseList(url.searchParams.get("country")),
    city: url.searchParams.get("city") ?? "",
    languages: parseList(url.searchParams.get("language")),
    specialties: parseList(url.searchParams.get("specialty")),
    direction:
      direction === "inbound" || direction === "outbound" ? direction : null,
    category: url.searchParams.get("category") ?? "",
    minPrice: Number(url.searchParams.get("minPrice")) || 0,
    maxPrice: Number(url.searchParams.get("maxPrice")) || 0,
    minRating: Number(url.searchParams.get("minRating")) || 0,
    sort: (url.searchParams.get("sort") ?? "relevance") as SortKey,
    page: Number(url.searchParams.get("page")) || 1,
    pageSize: Number(url.searchParams.get("pageSize")) || 12,
    suggest: url.searchParams.get("suggest") === "1",
  });
  return Response.json(result);
}
