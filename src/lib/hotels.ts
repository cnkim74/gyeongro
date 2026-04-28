// 호텔 메타서치 Affiliate URL 빌더
//
// 정책: 항공권과 동일 — 직접 예약 ❌, 외부 redirect ✅
//
// 환경 변수 (.env.local):
//   NEXT_PUBLIC_TRIP_ALLIANCE_ID    Trip.com Affiliate ID (항공과 공통)
//   NEXT_PUBLIC_TRIP_SID            Trip.com SubID (항공과 공통)
//   NEXT_PUBLIC_BOOKING_AID         Booking.com Affiliate ID (aid)
//   NEXT_PUBLIC_AGODA_CID           Agoda Campaign ID (cid)
//
// 환경변수가 없어도 링크는 정상 동작 — 단지 commission 미수령.

export interface HotelSearchParams {
  destination: string; // 도시명 또는 호텔명 (Tokyo / 시부야 / Shilla Stay 등)
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults?: number; // 기본 2
  rooms?: number; // 기본 1
  children?: number; // 기본 0
}

/** YYYY-MM-DD → YYYYMMDD (Trip.com 일부 엔드포인트용) */
function toCompact(date: string): string {
  return date.replace(/-/g, "");
}

/** Trip.com Hotels 검색 URL (한국어) */
export function buildTripComHotelUrl(p: HotelSearchParams): string {
  const adults = Math.max(1, p.adults ?? 2);
  const rooms = Math.max(1, p.rooms ?? 1);
  const children = Math.max(0, p.children ?? 0);

  const params = new URLSearchParams({
    keyword: p.destination,
    cityName: p.destination,
    checkin: p.checkIn,
    checkout: p.checkOut,
    adult: String(adults),
    children: String(children),
    crn: String(rooms),
    locale: "ko-KR",
    curr: "KRW",
  });

  const allianceId = process.env.NEXT_PUBLIC_TRIP_ALLIANCE_ID;
  const sid = process.env.NEXT_PUBLIC_TRIP_SID;
  if (allianceId) params.set("Allianceid", allianceId);
  if (sid) params.set("SID", sid);

  return `https://kr.trip.com/hotels/?${params.toString()}`;
}

/** Booking.com 검색 URL (한국어) */
export function buildBookingUrl(p: HotelSearchParams): string {
  const adults = Math.max(1, p.adults ?? 2);
  const rooms = Math.max(1, p.rooms ?? 1);
  const children = Math.max(0, p.children ?? 0);

  const params = new URLSearchParams({
    ss: p.destination,
    checkin: p.checkIn,
    checkout: p.checkOut,
    group_adults: String(adults),
    group_children: String(children),
    no_rooms: String(rooms),
    selected_currency: "KRW",
    lang: "ko",
  });

  const aid = process.env.NEXT_PUBLIC_BOOKING_AID;
  if (aid) params.set("aid", aid);

  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

/** Agoda 검색 URL */
export function buildAgodaUrl(p: HotelSearchParams): string {
  const adults = Math.max(1, p.adults ?? 2);
  const rooms = Math.max(1, p.rooms ?? 1);
  const children = Math.max(0, p.children ?? 0);

  const params = new URLSearchParams({
    text: p.destination,
    checkIn: p.checkIn,
    checkOut: p.checkOut,
    adults: String(adults),
    rooms: String(rooms),
    children: String(children),
    locale: "ko-kr",
    currency: "KRW",
  });

  const cid = process.env.NEXT_PUBLIC_AGODA_CID;
  if (cid) params.set("cid", cid);

  return `https://www.agoda.com/search?${params.toString()}`;
}

/** 3개 Provider URL 한 번에 */
export function buildHotelSearchUrls(p: HotelSearchParams): {
  tripcom: string;
  booking: string;
  agoda: string;
} {
  return {
    tripcom: buildTripComHotelUrl(p),
    booking: buildBookingUrl(p),
    agoda: buildAgodaUrl(p),
  };
}

/** 일정의 첫 날 ~ 마지막 날 = 호텔 박수와 호환 (체크아웃은 마지막 활동일 + 1) */
export function nightsToCheckOut(checkIn: string, nights: number): string {
  const d = new Date(checkIn + "T00:00:00");
  d.setDate(d.getDate() + nights);
  return d.toLocaleDateString("sv-SE");
}

// 자주 쓰이는 destination 표기 정리 — Booking/Agoda는 영문이 매칭 잘 됨
export const HOTEL_DESTINATION_HINTS: Record<string, string> = {
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
  호치민: "Ho Chi Minh City",
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
};

/** 한글 도시명 → 영문 표기 (Booking/Agoda 매칭률 향상) */
export function preferEnglish(destination: string): string {
  const trimmed = destination.trim();
  return HOTEL_DESTINATION_HINTS[trimmed] ?? trimmed;
}
