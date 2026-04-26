// 구글맵 URL 헬퍼

/**
 * 단일 장소 검색 URL
 * @param place 장소명 (예: "섭지코지")
 * @param destination 도시명 (예: "제주도") - 정확도 높이기 위해 추가
 */
export function getPlaceSearchUrl(place: string, destination?: string): string {
  const query = destination ? `${place}, ${destination}` : place;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * 경로(directions) URL - 여러 장소를 순서대로 연결
 * @param places 순서대로 방문할 장소들
 * @param destination 도시명 (정확도 보정)
 * @param mode 이동 수단
 */
export function getDirectionsUrl(
  places: string[],
  destination?: string,
  mode: "driving" | "walking" | "transit" | "bicycling" = "driving"
): string | null {
  const filtered = places.filter((p) => p && p.trim());
  if (filtered.length < 2) return null;

  const augment = (p: string) => (destination ? `${p}, ${destination}` : p);

  const origin = augment(filtered[0]);
  const dest = augment(filtered[filtered.length - 1]);
  const waypoints = filtered.slice(1, -1).map(augment);

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
  const query = destination ? `${place}, ${destination}` : place;
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

  const augment = (p: string) => (destination ? `${p}, ${destination}` : p);
  const origin = augment(filtered[0]);
  const dest = augment(filtered[filtered.length - 1]);
  const waypoints = filtered.slice(1, -1).map(augment);

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
