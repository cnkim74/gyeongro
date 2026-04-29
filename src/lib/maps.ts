// 구글맵 URL 헬퍼

/**
 * "한글(English)" 또는 "한글(Local)" 형식이면 괄호 안 부분 추출.
 * - "에펠탑(Eiffel Tower)" → "Eiffel Tower"
 * - "도톤보리(Dōtonbori)" → "Dōtonbori"
 * - "섭지코지" → "섭지코지" (그대로)
 *
 * Google 지오코더가 한글 음차보다 영문·현지어를 잘 인식하므로
 * 외국 장소 검색 시 효과적.
 */
function extractSearchableName(place: string): string {
  const trimmed = place.trim();
  // "이름(서브이름)" 패턴: 마지막 괄호 안의 내용 추출
  const match = trimmed.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (!match) return trimmed;
  const inside = match[2].trim();
  // 괄호 내용에 라틴/일본·중국 문자가 있으면 그쪽 사용 (지오코더가 더 잘 처리)
  if (/[A-Za-z]/.test(inside) || /[぀-ヿ一-鿿]/.test(inside)) {
    return inside;
  }
  return trimmed;
}

/**
 * 장소명에 도시명을 똑똑하게 추가:
 * - 빈 도시 → 그대로
 * - 이미 콤마(주소 형식) 포함 → 그대로 (이미 충분한 정보)
 * - 이미 도시명 포함 → 그대로 (중복 방지)
 * - 짧은 장소명 → 도시 추가 (정확도 향상)
 */
function smartAugment(place: string, destination?: string): string {
  const cleaned = extractSearchableName(place);
  if (!destination) return cleaned;
  const trimmedCity = destination.trim();
  if (!trimmedCity || !cleaned) return cleaned;

  // 콤마 있으면 이미 주소 형식 — 도시 중복 방지
  if (cleaned.includes(",")) return cleaned;

  // 도시명이 이미 포함되어 있으면 그대로 (대소문자 무시)
  const lowerPlace = cleaned.toLowerCase();
  const lowerDest = trimmedCity.toLowerCase();
  if (lowerPlace.includes(lowerDest)) return cleaned;

  // 다중 도시 destination인 경우 (콤마/화살표 포함) → 추가 안 함
  if (/[,→/]|에서|부터|까지/.test(trimmedCity)) return cleaned;

  return `${cleaned}, ${trimmedCity}`;
}

/**
 * 단일 장소 검색 URL
 * @param place 장소명 (예: "섭지코지")
 * @param destination 도시명 (예: "제주도") - 정확도 높이기 위해 추가
 */
export function getPlaceSearchUrl(place: string, destination?: string): string {
  const query = smartAugment(place, destination);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * 경로(directions) URL - 여러 장소를 순서대로 연결
 */
export function getDirectionsUrl(
  places: string[],
  destination?: string,
  mode: "driving" | "walking" | "transit" | "bicycling" = "driving"
): string | null {
  const filtered = places.filter((p) => p && p.trim());
  if (filtered.length < 2) return null;

  const origin = smartAugment(filtered[0], destination);
  const dest = smartAugment(filtered[filtered.length - 1], destination);
  const waypoints = filtered.slice(1, -1).map((p) => smartAugment(p, destination));

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination: dest,
    travelmode: mode,
  });
  if (waypoints.length > 0) {
    params.append("waypoints", waypoints.join("|"));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Embed API용 단일 장소 URL (iframe src)
 */
export function getPlaceEmbedUrl(
  place: string,
  destination?: string,
  apiKey?: string
): string | null {
  if (!apiKey) return null;
  const query = smartAugment(place, destination);
  const params = new URLSearchParams({
    key: apiKey,
    q: query,
  });
  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}

/**
 * Embed API용 경로 URL (iframe src)
 */
export function getDirectionsEmbedUrl(
  places: string[],
  destination?: string,
  apiKey?: string,
  mode: "driving" | "walking" | "transit" | "bicycling" = "driving"
): string | null {
  if (!apiKey) return null;
  const filtered = places.filter((p) => p && p.trim());
  if (filtered.length < 2) return null;

  const origin = smartAugment(filtered[0], destination);
  const dest = smartAugment(filtered[filtered.length - 1], destination);
  const waypoints = filtered.slice(1, -1).map((p) => smartAugment(p, destination));

  const params = new URLSearchParams({
    key: apiKey,
    origin,
    destination: dest,
    mode,
  });
  if (waypoints.length > 0) {
    params.append("waypoints", waypoints.join("|"));
  }
  return `https://www.google.com/maps/embed/v1/directions?${params.toString()}`;
}

