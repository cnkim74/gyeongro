// 통합 검색 — 셰르파 + 의료 클리닉 + 큐레이티드 테마
//
// GET /api/search?q=검색어&limit=8
//   -> { query, sherpas, clinics, themes }
//
// 매칭: ILIKE %q% (간단한 부분 문자열 매치, MVP)
// locale별 컬럼(name_en/description_en 등)도 함께 검색

import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SherpaResult {
  type: "sherpa";
  slug: string;
  display_name: string;
  tagline: string | null;
  countries: string[];
  cities: string[];
  languages: string[];
  specialties: string[];
  rating_avg: number | null;
  rating_count: number;
  avatar_url: string | null;
}

interface ClinicResult {
  type: "clinic";
  slug: string;
  name: string;
  name_en: string | null;
  city: string;
  country: string;
  direction: "inbound" | "outbound";
  description: string | null;
  specialties: string[] | null;
}

interface ThemeResult {
  type: "theme";
  slug: string;
  title: string;
  subtitle: string | null;
  destination: string | null;
  category: string;
  cover_image_url: string | null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get("limit") ?? 8)));

  if (q.length < 1) {
    return Response.json({
      query: q,
      sherpas: [],
      clinics: [],
      themes: [],
    });
  }

  const supabase = getSupabaseServiceClient();
  const pattern = `%${q.replace(/[%_]/g, "")}%`;

  // 병렬 쿼리
  const [sherpasRes, clinicsRes, themesRes] = await Promise.all([
    // 셰르파: display_name + tagline + tagline_en + bio + bio_en
    // PostgREST의 .or() 로 OR 조합
    supabase
      .from("sherpas")
      .select(
        "slug, display_name, tagline, tagline_en, countries, cities, cities_en, languages, specialties, rating_avg, rating_count, avatar_url"
      )
      .eq("status", "published")
      .or(
        [
          `display_name.ilike.${pattern}`,
          `tagline.ilike.${pattern}`,
          `tagline_en.ilike.${pattern}`,
          `bio.ilike.${pattern}`,
          `bio_en.ilike.${pattern}`,
        ].join(",")
      )
      .order("rating_avg", { ascending: false, nullsFirst: false })
      .limit(limit),

    // 클리닉: name, name_en, description, description_en, city, city_en
    supabase
      .from("medical_clinics")
      .select(
        "slug, name, name_en, city, city_en, country, direction, description, description_en, specialties, specialties_en"
      )
      .eq("status", "published")
      .or(
        [
          `name.ilike.${pattern}`,
          `name_en.ilike.${pattern}`,
          `description.ilike.${pattern}`,
          `description_en.ilike.${pattern}`,
          `city.ilike.${pattern}`,
          `city_en.ilike.${pattern}`,
        ].join(",")
      )
      .order("display_order")
      .limit(limit),

    // 큐레이티드 테마: title, subtitle, destination
    supabase
      .from("curated_themes")
      .select(
        "slug, title, subtitle, description, destination, category, cover_image_url"
      )
      .or(
        [
          `title.ilike.${pattern}`,
          `subtitle.ilike.${pattern}`,
          `description.ilike.${pattern}`,
          `destination.ilike.${pattern}`,
        ].join(",")
      )
      .limit(limit),
  ]);

  // 추가로 도시/전문분야 배열 매칭 (배열 안에 q가 포함된 요소 있는지)
  const lowerQ = q.toLowerCase();
  const sherpaArrayMatches = (
    await supabase
      .from("sherpas")
      .select(
        "slug, display_name, tagline, tagline_en, countries, cities, cities_en, languages, specialties, rating_avg, rating_count, avatar_url"
      )
      .eq("status", "published")
      .order("rating_avg", { ascending: false, nullsFirst: false })
      .limit(60)
  ).data ?? [];

  const arrayHits = sherpaArrayMatches.filter((s) => {
    const hay = [
      ...(s.cities ?? []),
      ...(s.cities_en ?? []),
      ...(s.specialties ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(lowerQ);
  });

  // 셰르파 머지 (중복 제거)
  const sherpaMap = new Map<string, SherpaResult>();
  for (const s of (sherpasRes.data ?? [])) {
    sherpaMap.set(s.slug, { type: "sherpa", ...s });
  }
  for (const s of arrayHits) {
    if (!sherpaMap.has(s.slug)) {
      sherpaMap.set(s.slug, { type: "sherpa", ...s });
    }
  }
  const sherpas = Array.from(sherpaMap.values()).slice(0, limit);

  const clinics: ClinicResult[] = (clinicsRes.data ?? []).map((c) => ({
    type: "clinic" as const,
    slug: c.slug,
    name: c.name,
    name_en: c.name_en,
    city: c.city,
    country: c.country,
    direction: c.direction as "inbound" | "outbound",
    description: c.description,
    specialties: c.specialties,
  }));

  const themes: ThemeResult[] = (themesRes.data ?? []).map((t) => ({
    type: "theme" as const,
    slug: t.slug,
    title: t.title,
    subtitle: t.subtitle,
    destination: t.destination,
    category: t.category,
    cover_image_url: t.cover_image_url,
  }));

  return Response.json({ query: q, sherpas, clinics, themes });
}
