// 통합 검색 코어 — API 라우트와 /search 페이지가 공유합니다.

import { getSupabaseServiceClient } from "./supabase";

export type SearchType = "all" | "sherpa" | "clinic" | "theme";
export type SortKey =
  | "relevance"
  | "rating"
  | "price_asc"
  | "price_desc"
  | "newest";

export interface SearchParams {
  q: string;
  type?: SearchType;
  countries?: string[];
  city?: string;
  languages?: string[];
  specialties?: string[];
  direction?: "inbound" | "outbound" | null;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
  /** suggest 모드 — 각 타입별 4개씩 빠르게 가져옵니다 */
  suggest?: boolean;
}

export interface SherpaResult {
  type: "sherpa";
  slug: string;
  display_name: string;
  tagline: string | null;
  countries: string[];
  cities: string[];
  languages: string[];
  specialties: string[];
  hourly_rate_krw: number | null;
  full_day_rate_krw: number | null;
  rating_avg: number | null;
  rating_count: number;
  avatar_url: string | null;
}

export interface ClinicResult {
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

export interface ThemeResult {
  type: "theme";
  slug: string;
  title: string;
  subtitle: string | null;
  destination: string | null;
  category: string;
  cover_image_url: string | null;
}

export interface SearchResponse {
  query: string;
  type: SearchType;
  page: number;
  pageSize: number;
  totals: { sherpa: number; clinic: number; theme: number };
  sherpas: SherpaResult[];
  clinics: ClinicResult[];
  themes: ThemeResult[];
}

const EMPTY_RESPONSE = (q: string, type: SearchType, page: number, pageSize: number): SearchResponse => ({
  query: q,
  type,
  page,
  pageSize,
  totals: { sherpa: 0, clinic: 0, theme: 0 },
  sherpas: [],
  clinics: [],
  themes: [],
});

export async function performSearch(input: SearchParams): Promise<SearchResponse> {
  const q = (input.q ?? "").trim();
  const type = input.type ?? "all";
  const suggest = input.suggest ?? false;
  const page = Math.max(1, input.page ?? 1);
  const pageSize = suggest
    ? 4
    : Math.min(24, Math.max(1, input.pageSize ?? 12));

  if (q.length < 1) return EMPTY_RESPONSE(q, type, page, pageSize);

  const countries = input.countries ?? [];
  const city = (input.city ?? "").trim();
  const languages = input.languages ?? [];
  const specialties = input.specialties ?? [];
  const direction = input.direction ?? null;
  const category = (input.category ?? "").trim();
  const minPrice = input.minPrice ?? 0;
  const maxPrice = input.maxPrice ?? 0;
  const minRating = input.minRating ?? 0;
  const sort = input.sort ?? "relevance";

  const supabase = getSupabaseServiceClient();
  const safeQ = q.replace(/[%_]/g, "");
  const pattern = `%${safeQ}%`;
  const lowerQ = q.toLowerCase();

  const wantsSherpa = suggest || type === "all" || type === "sherpa";
  const wantsClinic = suggest || type === "all" || type === "clinic";
  const wantsTheme = suggest || type === "all" || type === "theme";

  // ─────────────── SHERPAS ───────────────
  const sherpaPromise = (async () => {
    if (!wantsSherpa) return { rows: [] as SherpaResult[], total: 0 };

    let textQuery = supabase
      .from("sherpas")
      .select(
        "slug, display_name, tagline, countries, cities, cities_en, languages, specialties, hourly_rate_krw, full_day_rate_krw, rating_avg, rating_count, avatar_url, created_at"
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
      );

    let arrQuery = supabase
      .from("sherpas")
      .select(
        "slug, display_name, tagline, countries, cities, cities_en, languages, specialties, hourly_rate_krw, full_day_rate_krw, rating_avg, rating_count, avatar_url, created_at"
      )
      .eq("status", "published");

    if (countries.length > 0) {
      textQuery = textQuery.overlaps("countries", countries);
      arrQuery = arrQuery.overlaps("countries", countries);
    }
    if (languages.length > 0) {
      textQuery = textQuery.overlaps("languages", languages);
      arrQuery = arrQuery.overlaps("languages", languages);
    }
    if (specialties.length > 0) {
      textQuery = textQuery.overlaps("specialties", specialties);
      arrQuery = arrQuery.overlaps("specialties", specialties);
    }
    if (minPrice > 0) {
      textQuery = textQuery.gte("hourly_rate_krw", minPrice);
      arrQuery = arrQuery.gte("hourly_rate_krw", minPrice);
    }
    if (maxPrice > 0) {
      textQuery = textQuery.lte("hourly_rate_krw", maxPrice);
      arrQuery = arrQuery.lte("hourly_rate_krw", maxPrice);
    }
    if (minRating > 0) {
      textQuery = textQuery.gte("rating_avg", minRating);
      arrQuery = arrQuery.gte("rating_avg", minRating);
    }

    const [{ data: textRows }, { data: arrPool }] = await Promise.all([
      textQuery.limit(200),
      arrQuery.limit(200),
    ]);

    const arrHits = (arrPool ?? []).filter((s) => {
      const hay = [
        ...(s.cities ?? []),
        ...(s.cities_en ?? []),
        ...(s.specialties ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(lowerQ);
    });

    const merged = new Map<string, (typeof arrHits)[number]>();
    for (const s of textRows ?? []) merged.set(s.slug, s);
    for (const s of arrHits) if (!merged.has(s.slug)) merged.set(s.slug, s);

    let rows = Array.from(merged.values());
    if (city) {
      const cl = city.toLowerCase();
      rows = rows.filter((s) =>
        [...(s.cities ?? []), ...(s.cities_en ?? [])].some((c) =>
          c?.toLowerCase().includes(cl)
        )
      );
    }

    rows.sort((a, b) => sherpaSortFn(a, b, sort, lowerQ));

    const total = rows.length;
    const paged = suggest
      ? rows.slice(0, pageSize)
      : rows.slice((page - 1) * pageSize, page * pageSize);

    return {
      total,
      rows: paged.map<SherpaResult>((s) => ({
        type: "sherpa",
        slug: s.slug,
        display_name: s.display_name,
        tagline: s.tagline,
        countries: s.countries ?? [],
        cities: s.cities ?? [],
        languages: s.languages ?? [],
        specialties: s.specialties ?? [],
        hourly_rate_krw: s.hourly_rate_krw,
        full_day_rate_krw: s.full_day_rate_krw,
        rating_avg: s.rating_avg,
        rating_count: s.rating_count,
        avatar_url: s.avatar_url,
      })),
    };
  })();

  // ─────────────── CLINICS ───────────────
  const clinicPromise = (async () => {
    if (!wantsClinic) return { rows: [] as ClinicResult[], total: 0 };

    let qb = supabase
      .from("medical_clinics")
      .select(
        "slug, name, name_en, city, city_en, country, direction, description, specialties, display_order, created_at",
        { count: "exact" }
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
      );

    if (countries.length > 0) qb = qb.in("country", countries);
    if (city) {
      const safeCity = city.replace(/[%_]/g, "");
      qb = qb.or(
        `city.ilike.%${safeCity}%,city_en.ilike.%${safeCity}%`
      );
    }
    if (direction === "inbound" || direction === "outbound") {
      qb = qb.eq("direction", direction);
    }

    qb =
      sort === "newest"
        ? qb.order("created_at", { ascending: false })
        : qb.order("display_order", { ascending: true });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const range = suggest ? [0, pageSize - 1] : [from, to];
    const { data, count } = await qb.range(range[0], range[1]);

    return {
      total: count ?? data?.length ?? 0,
      rows: (data ?? []).map<ClinicResult>((c) => ({
        type: "clinic",
        slug: c.slug,
        name: c.name,
        name_en: c.name_en,
        city: c.city,
        country: c.country,
        direction: c.direction as "inbound" | "outbound",
        description: c.description,
        specialties: c.specialties,
      })),
    };
  })();

  // ─────────────── THEMES ───────────────
  const themePromise = (async () => {
    if (!wantsTheme) return { rows: [] as ThemeResult[], total: 0 };

    let qb = supabase
      .from("curated_themes")
      .select(
        "slug, title, subtitle, description, destination, category, cover_image_url, display_order, created_at",
        { count: "exact" }
      )
      .or(
        [
          `title.ilike.${pattern}`,
          `subtitle.ilike.${pattern}`,
          `description.ilike.${pattern}`,
          `destination.ilike.${pattern}`,
        ].join(",")
      );

    if (category) qb = qb.eq("category", category);
    if (city) {
      const safeCity = city.replace(/[%_]/g, "");
      qb = qb.ilike("destination", `%${safeCity}%`);
    }

    qb =
      sort === "newest"
        ? qb.order("created_at", { ascending: false })
        : qb.order("display_order", { ascending: true });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const range = suggest ? [0, pageSize - 1] : [from, to];
    const { data, count } = await qb.range(range[0], range[1]);

    return {
      total: count ?? data?.length ?? 0,
      rows: (data ?? []).map<ThemeResult>((t) => ({
        type: "theme",
        slug: t.slug,
        title: t.title,
        subtitle: t.subtitle,
        destination: t.destination,
        category: t.category,
        cover_image_url: t.cover_image_url,
      })),
    };
  })();

  const [sherpaRes, clinicRes, themeRes] = await Promise.all([
    sherpaPromise,
    clinicPromise,
    themePromise,
  ]);

  return {
    query: q,
    type,
    page,
    pageSize,
    totals: {
      sherpa: sherpaRes.total,
      clinic: clinicRes.total,
      theme: themeRes.total,
    },
    sherpas: sherpaRes.rows,
    clinics: clinicRes.rows,
    themes: themeRes.rows,
  };
}

function sherpaSortFn(
  a: {
    display_name: string;
    rating_avg: number | null;
    rating_count: number;
    hourly_rate_krw: number | null;
    created_at?: string | null;
  },
  b: typeof a,
  sort: SortKey,
  lowerQ: string
): number {
  switch (sort) {
    case "rating": {
      const ar = a.rating_count > 0 ? Number(a.rating_avg ?? 0) : -1;
      const br = b.rating_count > 0 ? Number(b.rating_avg ?? 0) : -1;
      if (br !== ar) return br - ar;
      return b.rating_count - a.rating_count;
    }
    case "price_asc": {
      const ap = a.hourly_rate_krw ?? Number.MAX_SAFE_INTEGER;
      const bp = b.hourly_rate_krw ?? Number.MAX_SAFE_INTEGER;
      return ap - bp;
    }
    case "price_desc": {
      const ap = a.hourly_rate_krw ?? -1;
      const bp = b.hourly_rate_krw ?? -1;
      return bp - ap;
    }
    case "newest": {
      const at = a.created_at ? Date.parse(a.created_at) : 0;
      const bt = b.created_at ? Date.parse(b.created_at) : 0;
      return bt - at;
    }
    case "relevance":
    default: {
      const an = a.display_name.toLowerCase();
      const bn = b.display_name.toLowerCase();
      const aPrefix = an.startsWith(lowerQ) ? 0 : an.includes(lowerQ) ? 1 : 2;
      const bPrefix = bn.startsWith(lowerQ) ? 0 : bn.includes(lowerQ) ? 1 : 2;
      if (aPrefix !== bPrefix) return aPrefix - bPrefix;
      const ar = a.rating_count > 0 ? Number(a.rating_avg ?? 0) : -1;
      const br = b.rating_count > 0 ? Number(b.rating_avg ?? 0) : -1;
      return br - ar;
    }
  }
}
