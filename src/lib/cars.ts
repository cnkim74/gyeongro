// 렌트카 메타서치 Affiliate URL 빌더
//
// 정책: 항공·호텔·액티비티와 동일 — 직접 예약 ❌, 외부 redirect ✅
//
// 환경 변수 (.env.local):
//   NEXT_PUBLIC_TRIP_ALLIANCE_ID    Trip.com Affiliate (다른 모듈과 공통)
//   NEXT_PUBLIC_TRIP_SID            Trip.com SubID
//   NEXT_PUBLIC_RENTALCARS_AID      Rentalcars.com affiliateCode
//   NEXT_PUBLIC_DISCOVERCARS_AID    DiscoverCars affiliate ID (aff)

export interface CarSearchParams {
  pickupCity: string; // 픽업 도시 (Tokyo / 도쿄)
  returnCity?: string; // 반납 도시 (없으면 pickup과 동일)
  pickupDate: string; // YYYY-MM-DD
  pickupTime?: string; // HH:MM (기본 10:00)
  returnDate: string; // YYYY-MM-DD
  returnTime?: string; // HH:MM (기본 10:00)
  driverAge?: number; // 만 나이 (Rentalcars 일부 시장 필수, 기본 30)
}

const DEFAULT_TIME = "10:00";

function parseDateParts(yyyymmdd: string): {
  yyyy: string;
  mm: string;
  dd: string;
} {
  const [y, m, d] = yyyymmdd.split("-");
  return { yyyy: y, mm: m, dd: d };
}

/** Trip.com 렌트카 검색 URL (한국어) */
export function buildTripComCarUrl(p: CarSearchParams): string {
  const params = new URLSearchParams({
    keyword: p.pickupCity,
    cityName: p.pickupCity,
    pickupDate: p.pickupDate,
    pickupTime: p.pickupTime ?? DEFAULT_TIME,
    returnDate: p.returnDate,
    returnTime: p.returnTime ?? DEFAULT_TIME,
    locale: "ko-KR",
    curr: "KRW",
  });
  if (p.returnCity && p.returnCity !== p.pickupCity) {
    params.set("returnCityName", p.returnCity);
  }

  const allianceId = process.env.NEXT_PUBLIC_TRIP_ALLIANCE_ID;
  const sid = process.env.NEXT_PUBLIC_TRIP_SID;
  if (allianceId) params.set("Allianceid", allianceId);
  if (sid) params.set("SID", sid);

  return `https://kr.trip.com/carhire/?${params.toString()}`;
}

/** Rentalcars.com 검색 URL */
export function buildRentalcarsUrl(p: CarSearchParams): string {
  const pu = parseDateParts(p.pickupDate);
  const ret = parseDateParts(p.returnDate);
  const [puH, puM] = (p.pickupTime ?? DEFAULT_TIME).split(":");
  const [doH, doM] = (p.returnTime ?? DEFAULT_TIME).split(":");

  const params = new URLSearchParams({
    puCity: p.pickupCity,
    doCity: p.returnCity ?? p.pickupCity,
    puDay: pu.dd,
    puMonth: pu.mm,
    puYear: pu.yyyy,
    puHour: puH,
    puMinute: puM,
    doDay: ret.dd,
    doMonth: ret.mm,
    doYear: ret.yyyy,
    doHour: doH,
    doMinute: doM,
    driversAge: String(p.driverAge ?? 30),
    preflang: "ko",
    currency: "KRW",
  });

  const aid = process.env.NEXT_PUBLIC_RENTALCARS_AID;
  if (aid) params.set("affiliateCode", aid);

  return `https://www.rentalcars.com/SearchResults.do?${params.toString()}`;
}

/** DiscoverCars.com 검색 URL */
export function buildDiscoverCarsUrl(p: CarSearchParams): string {
  const params = new URLSearchParams({
    location: p.pickupCity,
    pickupDate: p.pickupDate,
    returnDate: p.returnDate,
    pickupTime: p.pickupTime ?? DEFAULT_TIME,
    returnTime: p.returnTime ?? DEFAULT_TIME,
    driverAge: String(p.driverAge ?? 30),
    lang: "ko",
    currency: "KRW",
  });
  if (p.returnCity && p.returnCity !== p.pickupCity) {
    params.set("returnLocation", p.returnCity);
  }

  const aff = process.env.NEXT_PUBLIC_DISCOVERCARS_AID;
  if (aff) params.set("aff", aff);

  return `https://www.discovercars.com/?${params.toString()}`;
}

/** 3 Provider URL 한 번에 */
export function buildCarSearchUrls(p: CarSearchParams): {
  tripcom: string;
  rentalcars: string;
  discovercars: string;
} {
  return {
    tripcom: buildTripComCarUrl(p),
    rentalcars: buildRentalcarsUrl(p),
    discovercars: buildDiscoverCarsUrl(p),
  };
}

// 한글 도시 → 영문 (Rentalcars/DiscoverCars 매칭률 향상)
export const CAR_DESTINATION_HINTS: Record<string, string> = {
  도쿄: "Tokyo",
  오사카: "Osaka",
  교토: "Kyoto",
  후쿠오카: "Fukuoka",
  삿포로: "Sapporo",
  오키나와: "Okinawa Naha",
  방콕: "Bangkok",
  푸켓: "Phuket",
  치앙마이: "Chiang Mai",
  발리: "Bali Denpasar",
  다낭: "Da Nang",
  호치민: "Ho Chi Minh",
  하노이: "Hanoi",
  세부: "Cebu",
  코타키나발루: "Kota Kinabalu",
  쿠알라룸푸르: "Kuala Lumpur",
  싱가포르: "Singapore",
  타이베이: "Taipei",
  홍콩: "Hong Kong",
  서울: "Seoul",
  부산: "Busan",
  제주: "Jeju Island",
  파리: "Paris",
  런던: "London",
  로마: "Rome",
  바르셀로나: "Barcelona",
  마드리드: "Madrid",
  뉴욕: "New York",
  로스앤젤레스: "Los Angeles",
  샌프란시스코: "San Francisco",
  라스베가스: "Las Vegas",
  하와이: "Honolulu",
  괌: "Guam",
  사이판: "Saipan",
  시드니: "Sydney",
  오클랜드: "Auckland",
};

export function preferEnglishCar(destination: string): string {
  const trimmed = destination.trim();
  return CAR_DESTINATION_HINTS[trimmed] ?? trimmed;
}
