// Google Places API (New) — 서버 전용 헬퍼
//
// - resolvePlaces(): 장소명 → place ID + 좌표 (Text Search, Pro 필드만 → 월 5,000건 무료)
// - getPlaceDetails(): 평점·리뷰 수·영업시간·웹사이트·사진 (Place Details Enterprise → 월 1,000건 무료)
//   → 사용자가 장소를 눌렀을 때만 호출
//
// Google Maps Platform 약관:
//   - place ID 는 기한 없이 저장 가능
//   - 위도/경도는 최대 30일까지만 캐시 가능 → place_cache.updated_at 기준으로 갱신
//   - 평점·리뷰·사진 등 장소 콘텐츠는 캐시하지 않음
//
// 환경변수: GOOGLE_MAPS_SERVER_KEY (Places API (New) 로 제한된 서버용 키)

import { getSupabaseServiceClient } from "./supabase";

const PLACES_BASE = "https://places.googleapis.com/v1";
const COORD_TTL_MS = 29 * 24 * 60 * 60 * 1000; // 30일 이내

export interface PlaceGeo {
  placeId: string;
  lat: number;
  lng: number;
  /** 좌표를 가져온 시각 (ISO) — 30일 지나면 다시 조회 */
  at: string;
}

export interface PlaceQuery {
  place: string;
  /** 장소가 속한 도시 (검색 정확도용) */
  city?: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string | null;
  rating: number | null;
  userRatingCount: number | null;
  weekdayHours: string[] | null;
  websiteUri: string | null;
  googleMapsUri: string | null;
  photoUri: string | null;
  /** 사진 저작자 표기 (Google 약관상 표시 필요) */
  photoAttributions: { name: string; uri: string | null }[];
}

function serverKey(): string | null {
  return process.env.GOOGLE_MAPS_SERVER_KEY || null;
}

/** "한글(English)" → 괄호 안 라틴/일본·중국 표기를 우선 사용 (지오코딩 정확도) */
function searchableName(place: string): string {
  const m = place.trim().match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (!m) return place.trim();
  const inside = m[2].trim();
  if (/[A-Za-z]/.test(inside) || /[぀-ヿ一-鿿]/.test(inside)) return inside;
  return place.trim();
}

export function buildQueryText({ place, city }: PlaceQuery): string {
  const name = searchableName(place);
  if (!city) return name;
  const c = city.trim();
  // 여러 도시가 섞인 목적지 문자열은 붙이지 않음
  if (!c || /[,→/]|에서|부터|까지/.test(c)) return name;
  if (name.toLowerCase().includes(c.toLowerCase())) return name;
  return `${name} ${c}`;
}

function cacheKey(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/** 캐시 테이블이 아직 없으면(마이그레이션 전) 조용히 건너뜀 */
async function readCache(keys: string[]) {
  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("place_cache")
      .select("query_key, place_id, lat, lng, updated_at")
      .in("query_key", keys);
    if (error) return new Map<string, { place_id: string | null; lat: number | null; lng: number | null; updated_at: string }>();
    return new Map(data.map((r) => [r.query_key as string, r]));
  } catch {
    return new Map();
  }
}

async function writeCache(rows: { query_key: string; place_id: string | null; lat: number | null; lng: number | null }[]) {
  if (rows.length === 0) return;
  try {
    const supabase = getSupabaseServiceClient();
    await supabase
      .from("place_cache")
      .upsert(
        rows.map((r) => ({ ...r, updated_at: new Date().toISOString() })),
        { onConflict: "query_key" }
      );
  } catch {
    // 캐시 실패는 무시
  }
}

async function textSearch(text: string, key: string): Promise<{ placeId: string; lat: number; lng: number } | null> {
  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      // Pro 필드만 요청 (평점 등 Enterprise 필드 제외 → 무료 한도 5,000건)
      "X-Goog-FieldMask": "places.id,places.location",
    },
    body: JSON.stringify({ textQuery: text, languageCode: "ko", pageSize: 1 }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    places?: { id: string; location?: { latitude: number; longitude: number } }[];
  };
  const p = data.places?.[0];
  if (!p?.id || !p.location) return null;
  return { placeId: p.id, lat: p.location.latitude, lng: p.location.longitude };
}

/** place ID 로 좌표만 다시 받기 (Place Details Essentials — 월 10,000건 무료) */
async function locationById(placeId: string, key: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(`${PLACES_BASE}/places/${encodeURIComponent(placeId)}`, {
    headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "location" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const d = (await res.json()) as { location?: { latitude: number; longitude: number } };
  if (!d.location) return null;
  return { lat: d.location.latitude, lng: d.location.longitude };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    })
  );
  return out;
}

/**
 * 장소 목록 → 좌표 (입력 순서 그대로, 못 찾으면 null)
 * 키가 없으면 전부 null 반환 (지도 기능만 비활성, 일정 생성은 계속)
 */
export async function resolvePlaces(queries: PlaceQuery[]): Promise<(PlaceGeo | null)[]> {
  const key = serverKey();
  if (!key || queries.length === 0) return queries.map(() => null);

  const texts = queries.map(buildQueryText);
  const keys = texts.map(cacheKey);
  const unique = Array.from(new Set(keys));
  const cached = await readCache(unique);
  const now = Date.now();

  const resolved = new Map<string, PlaceGeo | null>();
  const toWrite: { query_key: string; place_id: string | null; lat: number | null; lng: number | null }[] = [];

  await mapLimit(unique, 8, async (k) => {
    const text = texts[keys.indexOf(k)];
    const hit = cached.get(k);
    try {
      if (hit && hit.place_id && hit.lat != null && hit.lng != null &&
          now - new Date(hit.updated_at).getTime() < COORD_TTL_MS) {
        resolved.set(k, { placeId: hit.place_id, lat: hit.lat, lng: hit.lng, at: hit.updated_at });
        return;
      }
      // place ID 는 있는데 좌표가 오래됨 → ID 로 좌표만 갱신 (저렴)
      if (hit?.place_id) {
        const loc = await locationById(hit.place_id, key);
        if (loc) {
          resolved.set(k, { placeId: hit.place_id, ...loc, at: new Date().toISOString() });
          toWrite.push({ query_key: k, place_id: hit.place_id, ...loc });
          return;
        }
      }
      const found = await textSearch(text, key);
      resolved.set(k, found ? { ...found, at: new Date().toISOString() } : null);
      toWrite.push({
        query_key: k,
        place_id: found?.placeId ?? null,
        lat: found?.lat ?? null,
        lng: found?.lng ?? null,
      });
    } catch {
      resolved.set(k, null);
    }
  });

  await writeCache(toWrite);
  return keys.map((k) => resolved.get(k) ?? null);
}

/** 장소 상세 (평점·영업시간·사진 등) — 캐시하지 않음 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const key = serverKey();
  if (!key) return null;

  const res = await fetch(
    `${PLACES_BASE}/places/${encodeURIComponent(placeId)}?languageCode=ko`,
    {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "id,displayName,rating,userRatingCount,regularOpeningHours.weekdayDescriptions,websiteUri,googleMapsUri,photos",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  const d = (await res.json()) as {
    id: string;
    displayName?: { text: string };
    rating?: number;
    userRatingCount?: number;
    regularOpeningHours?: { weekdayDescriptions?: string[] };
    websiteUri?: string;
    googleMapsUri?: string;
    photos?: { name: string; authorAttributions?: { displayName: string; uri?: string }[] }[];
  };

  let photoUri: string | null = null;
  let photoAttributions: PlaceDetails["photoAttributions"] = [];
  const photo = d.photos?.[0];
  if (photo?.name) {
    try {
      const pr = await fetch(
        `${PLACES_BASE}/${photo.name}/media?maxWidthPx=800&skipHttpRedirect=true`,
        { headers: { "X-Goog-Api-Key": key }, cache: "no-store" }
      );
      if (pr.ok) {
        const pj = (await pr.json()) as { photoUri?: string };
        photoUri = pj.photoUri ?? null;
        photoAttributions = (photo.authorAttributions ?? []).map((a) => ({
          name: a.displayName,
          uri: a.uri ?? null,
        }));
      }
    } catch {
      // 사진 실패는 무시
    }
  }

  return {
    placeId: d.id,
    name: d.displayName?.text ?? null,
    rating: d.rating ?? null,
    userRatingCount: d.userRatingCount ?? null,
    weekdayHours: d.regularOpeningHours?.weekdayDescriptions ?? null,
    websiteUri: d.websiteUri ?? null,
    googleMapsUri: d.googleMapsUri ?? null,
    photoUri,
    photoAttributions,
  };
}
