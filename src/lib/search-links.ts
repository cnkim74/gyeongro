// 외부 검색 링크 빌더 — Google Maps / Naver Map / Instagram
//
// AI가 추천한 장소·식당의 정보 검증·SNS 핫플 확인용

/** Google Maps 장소 검색 (전 세계) */
export function googleMapsSearch(placeName: string, nearby?: string): string {
  const query = nearby ? `${placeName} ${nearby}` : placeName;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Naver 지도 (한국 도시 우선) */
export function naverMapSearch(placeName: string): string {
  return `https://map.naver.com/p/search/${encodeURIComponent(placeName)}`;
}

/** Instagram 해시태그 검색 — 공백 제거 후 #으로 */
export function instagramHashtag(placeName: string): string {
  // Instagram은 한글·영문·숫자만 허용. 공백 제거
  const clean = placeName.replace(/[\s\-·,()]/g, "");
  return `https://www.instagram.com/explore/tags/${encodeURIComponent(clean)}/`;
}

/** Google 일반 검색 — '플레이스 + 리뷰' 키워드 */
export function googleReviewSearch(placeName: string, nearby?: string): string {
  const query = nearby
    ? `${placeName} ${nearby} 리뷰`
    : `${placeName} 리뷰`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/** 한국 도시 여부로 Naver 우선 / Google 우선 결정 */
const KOREAN_CITIES_HINT = [
  "서울", "부산", "제주", "대구", "인천", "광주", "대전", "울산",
  "경주", "여수", "강릉", "전주", "춘천", "포항", "목포", "수원",
  "Seoul", "Busan", "Jeju", "Daegu", "Incheon",
];

export function isKoreanCity(destination: string): boolean {
  if (!destination) return false;
  const lower = destination.toLowerCase();
  return KOREAN_CITIES_HINT.some((c) => lower.includes(c.toLowerCase()));
}
