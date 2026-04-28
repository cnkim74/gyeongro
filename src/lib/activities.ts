// 액티비티·투어 메타서치 Affiliate URL 빌더
//
// 정책: 항공·호텔과 동일 — 직접 예약 ❌, 외부 redirect ✅
//
// 환경 변수 (.env.local):
//   NEXT_PUBLIC_KKDAY_AID            KKday Affiliate ID (utm_source/aid)
//   NEXT_PUBLIC_KLOOK_AID            Klook Affiliate ID (aid)
//   NEXT_PUBLIC_GYG_PARTNER_ID       GetYourGuide partner_id
//   NEXT_PUBLIC_TRAVELPAYOUTS_MARKER 통합 marker (KKday/Klook 일부 redirect용)
//
// 환경변수 미설정 시에도 링크 동작 — commission만 미수령.

export interface ActivitySearchParams {
  destination: string; // 도시·지역명 (Tokyo / Osaka / 도쿄 등)
  date?: string | null; // 활동 날짜 YYYY-MM-DD (선택)
  category?: string; // 'tour' | 'food' | 'show' | 'transport' | 'experience' (선택, GYG는 활용)
}

/** KKday 검색 URL (한국어) */
export function buildKKdayUrl(p: ActivitySearchParams): string {
  const params = new URLSearchParams({
    keyword: p.destination,
    spec: "true",
  });
  if (p.date) params.set("start_date", p.date);

  const aid = process.env.NEXT_PUBLIC_KKDAY_AID;
  if (aid) {
    params.set("utm_source", "affiliate");
    params.set("utm_medium", aid);
  }

  return `https://www.kkday.com/ko/search?${params.toString()}`;
}

/** Klook 검색 URL (한국어) */
export function buildKlookUrl(p: ActivitySearchParams): string {
  const params = new URLSearchParams({
    query: p.destination,
  });

  const aid = process.env.NEXT_PUBLIC_KLOOK_AID;
  if (aid) params.set("aid", aid);

  return `https://www.klook.com/ko/search/result/?${params.toString()}`;
}

/** GetYourGuide 검색 URL (한국어) */
export function buildGetYourGuideUrl(p: ActivitySearchParams): string {
  const params = new URLSearchParams({
    q: p.destination,
  });
  if (p.date) params.set("date_from", p.date);

  const partnerId = process.env.NEXT_PUBLIC_GYG_PARTNER_ID;
  if (partnerId) params.set("partner_id", partnerId);

  return `https://www.getyourguide.com/s/?${params.toString()}`;
}

/** 3 Provider URL 한 번에 */
export function buildActivitySearchUrls(p: ActivitySearchParams): {
  kkday: string;
  klook: string;
  getyourguide: string;
} {
  return {
    kkday: buildKKdayUrl(p),
    klook: buildKlookUrl(p),
    getyourguide: buildGetYourGuideUrl(p),
  };
}

// 한글 도시명 → 영문 (Klook/GYG 매칭 강화)
export const ACTIVITY_DESTINATION_HINTS: Record<string, string> = {
  도쿄: "Tokyo",
  오사카: "Osaka",
  교토: "Kyoto",
  후쿠오카: "Fukuoka",
  삿포로: "Sapporo",
  오키나와: "Okinawa",
  방콕: "Bangkok",
  푸켓: "Phuket",
  치앙마이: "Chiang Mai",
  발리: "Bali",
  다낭: "Da Nang",
  호치민: "Ho Chi Minh",
  하노이: "Hanoi",
  세부: "Cebu",
  코타키나발루: "Kota Kinabalu",
  쿠알라룸푸르: "Kuala Lumpur",
  싱가포르: "Singapore",
  타이베이: "Taipei",
  홍콩: "Hong Kong",
  마카오: "Macau",
  상하이: "Shanghai",
  베이징: "Beijing",
  서울: "Seoul",
  부산: "Busan",
  제주: "Jeju",
  파리: "Paris",
  런던: "London",
  로마: "Rome",
  바르셀로나: "Barcelona",
  뉴욕: "New York",
  로스앤젤레스: "Los Angeles",
  하와이: "Honolulu",
  괌: "Guam",
};

/** 한글 입력 시 영문 fallback */
export function preferEnglishActivity(destination: string): string {
  const trimmed = destination.trim();
  return ACTIVITY_DESTINATION_HINTS[trimmed] ?? trimmed;
}

// 카테고리별 추천 키워드 (UI 칩 hint용)
export const ACTIVITY_CATEGORIES = [
  { id: "tour", label: "투어", emoji: "🗺️" },
  { id: "food", label: "푸드 투어", emoji: "🍜" },
  { id: "show", label: "공연·티켓", emoji: "🎭" },
  { id: "transport", label: "공항 픽업", emoji: "🚖" },
  { id: "experience", label: "체험", emoji: "✨" },
  { id: "esim", label: "이심·와이파이", emoji: "📶" },
];
