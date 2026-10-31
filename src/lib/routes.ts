// 도로 기준 경로 (지도에 직선 대신 실제 도로를 따라 그리기 위함) — 서버 전용
//
// - 기본: Google Routes API computeRoutes (DRIVE, 경유지 최대 10개 → Essentials 요금, 월 10,000건 무료)
//   키: GOOGLE_MAPS_SERVER_KEY (Routes API 허용 필요)
//   ※ 구글은 한국 자동차 경로를 지원하지 않았으나 2026년 2월 정부 허가 이후 열릴 수 있어 국내도 먼저 시도
// - 국내 보조: 카카오모빌리티 자동차 길찾기
//   GET https://apis-navi.kakaomobility.com/v1/directions  (출발·도착 + 경유지 최대 5개)
//   키: KAKAO_REST_API_KEY (없으면 카카오 로그인용 KAKAO_CLIENT_ID = 같은 앱의 REST API 키)
//   ※ 상업 서비스는 무료 쿼터 안이라도 카카오모빌리티와 '사전 제휴 계약'이 필수
//     → 계약 후 KAKAO_DIRECTIONS_ENABLED=true 를 설정해야만 호출함
//
// 경로 결과는 저장하지 않음 (구글·카카오 모두 결과 저장·재사용 제한) — 요청 시마다 계산.

export interface RoutePoint {
  lat: number;
  lng: number;
  placeId?: string;
}

export interface DayRoute {
  /** [lat, lng] 배열 */
  path: [number, number][];
  provider: "kakao" | "google";
  distanceM: number;
  durationS: number;
}

export function isInKorea(lat: number, lng: number): boolean {
  return lat > 33 && lat < 38.7 && lng > 124.5 && lng < 131;
}

/** 점이 너무 많으면 균등하게 줄임 (응답 크기 축소) */
function downsample(path: [number, number][], max = 1500): [number, number][] {
  if (path.length <= max) return path;
  const step = path.length / max;
  const out: [number, number][] = [];
  for (let i = 0; i < max; i++) out.push(path[Math.floor(i * step)]);
  out.push(path[path.length - 1]);
  return out;
}

/** 연속 구간으로 나누기 (마지막 점이 다음 구간의 첫 점) */
function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length - 1; i += size - 1) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

// ── 카카오모빌리티 ───────────────────────────────────────────────
async function kakaoSegment(points: RoutePoint[], key: string) {
  const fmt = (p: RoutePoint) => `${p.lng},${p.lat}`;
  const params = new URLSearchParams({
    origin: fmt(points[0]),
    destination: fmt(points[points.length - 1]),
    priority: "RECOMMEND",
  });
  const mids = points.slice(1, -1);
  if (mids.length > 0) params.set("waypoints", mids.map(fmt).join("|"));

  const res = await fetch(`https://apis-navi.kakaomobility.com/v1/directions?${params.toString()}`, {
    headers: { Authorization: `KakaoAK ${key}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    routes?: {
      result_code?: number;
      summary?: { distance: number; duration: number };
      sections?: { roads?: { vertexes: number[] }[] }[];
    }[];
  };
  const r = data.routes?.[0];
  if (!r || (r.result_code !== undefined && r.result_code !== 0) || !r.sections) return null;

  const path: [number, number][] = [];
  for (const s of r.sections) {
    for (const road of s.roads ?? []) {
      const v = road.vertexes;
      // [lng1, lat1, lng2, lat2, ...]
      for (let i = 0; i + 1 < v.length; i += 2) path.push([v[i + 1], v[i]]);
    }
  }
  return { path, distanceM: r.summary?.distance ?? 0, durationS: r.summary?.duration ?? 0 };
}

async function kakaoRoute(points: RoutePoint[]): Promise<DayRoute | null> {
  const key = process.env.KAKAO_REST_API_KEY || process.env.KAKAO_CLIENT_ID;
  if (!key) return null;
  // 출발 + 경유지 5 + 도착 = 7개씩
  const segs = await Promise.all(chunks(points, 7).map((c) => kakaoSegment(c, key)));
  if (segs.some((s) => !s)) return null;
  return {
    path: downsample(segs.flatMap((s) => s!.path)),
    provider: "kakao",
    distanceM: segs.reduce((a, s) => a + s!.distanceM, 0),
    durationS: segs.reduce((a, s) => a + s!.durationS, 0),
  };
}

// ── Google Routes API ──────────────────────────────────────────
/** Google encoded polyline 디코딩 */
function decodePolyline(str: string): [number, number][] {
  const out: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < str.length) {
    for (const which of [0, 1]) {
      let result = 0, shift = 0, b: number;
      do {
        b = str.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (which === 0) lat += delta;
      else lng += delta;
    }
    out.push([lat / 1e5, lng / 1e5]);
  }
  return out;
}

function waypoint(p: RoutePoint) {
  return p.placeId
    ? { placeId: p.placeId }
    : { location: { latLng: { latitude: p.lat, longitude: p.lng } } };
}

async function googleSegment(points: RoutePoint[], key: string) {
  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration",
    },
    body: JSON.stringify({
      origin: waypoint(points[0]),
      destination: waypoint(points[points.length - 1]),
      intermediates: points.slice(1, -1).map(waypoint),
      travelMode: "DRIVE",
      languageCode: "ko",
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    // Routes API 미사용 설정·키 제한·지원 지역 아님 등 원인 확인용
    console.log(`[route] google status=${res.status} body=${(await res.text()).slice(0, 300)}`);
    return null;
  }
  const data = (await res.json()) as {
    routes?: { polyline?: { encodedPolyline?: string }; distanceMeters?: number; duration?: string }[];
  };
  const r = data.routes?.[0];
  if (!r?.polyline?.encodedPolyline) {
    console.log(`[route] google no route: ${JSON.stringify(data).slice(0, 200)}`);
    return null;
  }
  return {
    path: decodePolyline(r.polyline.encodedPolyline),
    distanceM: r.distanceMeters ?? 0,
    durationS: parseInt((r.duration ?? "0s").replace("s", ""), 10) || 0,
  };
}

async function googleRoute(points: RoutePoint[]): Promise<DayRoute | null> {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!key) return null;
  // 출발 + 경유지 10 + 도착 = 12개씩 (경유지 10개 이하 → Essentials 요금)
  const segs = await Promise.all(chunks(points, 12).map((c) => googleSegment(c, key)));
  if (segs.some((s) => !s)) return null;
  return {
    path: downsample(segs.flatMap((s) => s!.path)),
    provider: "google",
    distanceM: segs.reduce((a, s) => a + s!.distanceM, 0),
    durationS: segs.reduce((a, s) => a + s!.durationS, 0),
  };
}

/** 하루 동선(방문 순서대로)의 도로 경로. 실패하면 null → 화면은 점선 직선으로 표시 */
export async function getDayRoute(points: RoutePoint[]): Promise<DayRoute | null> {
  if (points.length < 2) return null;
  const allKorea = points.every((p) => isInKorea(p.lat, p.lng));
  let route: DayRoute | null = null;
  try {
    route = await googleRoute(points);
    // 국내인데 구글 경로가 없으면, 카카오 제휴 계약 후 켠 경우에만 카카오로 보완
    if (!route && allKorea && process.env.KAKAO_DIRECTIONS_ENABLED === "true") {
      route = await kakaoRoute(points);
    }
  } catch {
    route = null;
  }
  // 어떤 제공사가 성공했는지 확인용 (Vercel 로그)
  console.log(`[route] korea=${allKorea} points=${points.length} provider=${route?.provider ?? "none"}`);
  return route;
}
