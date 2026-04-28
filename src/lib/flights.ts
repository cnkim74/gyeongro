// 항공권 메타서치 Affiliate 링크 빌더
//
// 정책:
//   - 우리는 항공권을 직접 발권하지 않음 (여행업·IATA 미등록)
//   - 검색 UI 보여주고, 예약은 외부 Affiliate(Trip.com / Skyscanner via Travelpayouts)로 redirect
//   - 사용자가 외부에서 결제 → 우리는 commission만 수령
//
// 환경 변수 (.env.local):
//   NEXT_PUBLIC_TRIP_ALLIANCE_ID    Trip.com Affiliate ID (Allianceid)
//   NEXT_PUBLIC_TRIP_SID            Trip.com SubID (SID, 캠페인 추적용)
//   NEXT_PUBLIC_TRAVELPAYOUTS_MARKER  Travelpayouts marker (Aviasales/Skyscanner 통합)
//
// 환경 변수가 없어도 링크는 동작 — 단지 commission 미수령.

export interface FlightSearchParams {
  fromCity: string; // 한글 도시명 또는 IATA 코드
  toCity: string;
  departDate: string; // YYYY-MM-DD
  returnDate?: string | null;
  adults?: number; // 기본 1
}

// 한국·아시아·주요 미주·유럽 IATA 도시 코드 매핑 (top ~70)
// 도시 코드(SEL/TYO/OSA)는 여러 공항을 묶음, 검색 결과가 더 풍부.
export const CITY_TO_IATA: Record<string, string> = {
  // ── 한국 ──
  서울: "SEL", Seoul: "SEL", ICN: "SEL", GMP: "SEL", 인천: "SEL", 김포: "SEL",
  부산: "PUS", Busan: "PUS", 김해: "PUS",
  제주: "CJU", "제주도": "CJU", Jeju: "CJU",
  대구: "TAE", 청주: "CJJ", 양양: "YNY", 무안: "MWX",

  // ── 일본 ──
  도쿄: "TYO", Tokyo: "TYO", 동경: "TYO", 나리타: "NRT", 하네다: "HND",
  오사카: "OSA", Osaka: "OSA", 간사이: "KIX",
  교토: "OSA", Kyoto: "OSA",
  후쿠오카: "FUK", Fukuoka: "FUK",
  삿포로: "SPK", Sapporo: "SPK", 신치토세: "CTS",
  오키나와: "OKA", Okinawa: "OKA",
  나고야: "NGO", Nagoya: "NGO",
  히로시마: "HIJ", Hiroshima: "HIJ",
  센다이: "SDJ", 가고시마: "KOJ", 마쓰야마: "MYJ",

  // ── 동남아 ──
  방콕: "BKK", Bangkok: "BKK",
  푸켓: "HKT", Phuket: "HKT",
  치앙마이: "CNX", "Chiang Mai": "CNX",
  파타야: "UTP", Pattaya: "UTP",
  발리: "DPS", Bali: "DPS", 덴파사르: "DPS",
  자카르타: "CGK", Jakarta: "CGK",
  다낭: "DAD", "Da Nang": "DAD",
  호치민: "SGN", "Ho Chi Minh": "SGN", 사이공: "SGN",
  하노이: "HAN", Hanoi: "HAN",
  푸꾸옥: "PQC", "Phu Quoc": "PQC",
  나트랑: "CXR", Nhatrang: "CXR",
  세부: "CEB", Cebu: "CEB",
  마닐라: "MNL", Manila: "MNL",
  보라카이: "MPH", Boracay: "MPH",
  코타키나발루: "BKI", "Kota Kinabalu": "BKI",
  쿠알라룸푸르: "KUL", "Kuala Lumpur": "KUL", KL: "KUL",
  랑카위: "LGK", Langkawi: "LGK",
  싱가포르: "SIN", Singapore: "SIN",
  비엔티안: "VTE", Vientiane: "VTE",
  프놈펜: "PNH", "Phnom Penh": "PNH",

  // ── 중국·홍콩·대만 ──
  베이징: "BJS", Beijing: "BJS",
  상하이: "SHA", Shanghai: "SHA",
  광저우: "CAN", Guangzhou: "CAN",
  심천: "SZX", Shenzhen: "SZX",
  청두: "CTU", Chengdu: "CTU",
  홍콩: "HKG", "Hong Kong": "HKG",
  마카오: "MFM", Macau: "MFM",
  타이베이: "TPE", 대만: "TPE", Taipei: "TPE",
  가오슝: "KHH", Kaohsiung: "KHH",
  하이난: "HAK", Haikou: "HAK", 싼야: "SYX", Sanya: "SYX",

  // ── 미주 ──
  로스앤젤레스: "LAX", LA: "LAX",
  뉴욕: "NYC", "New York": "NYC", JFK: "NYC",
  샌프란시스코: "SFO", "San Francisco": "SFO",
  시애틀: "SEA", Seattle: "SEA",
  라스베가스: "LAS", "Las Vegas": "LAS",
  하와이: "HNL", Honolulu: "HNL",
  괌: "GUM", Guam: "GUM",
  사이판: "SPN", Saipan: "SPN",
  토론토: "YTO", Toronto: "YTO",
  밴쿠버: "YVR", Vancouver: "YVR",

  // ── 유럽 ──
  파리: "PAR", Paris: "PAR",
  런던: "LON", London: "LON",
  로마: "ROM", Rome: "ROM",
  바르셀로나: "BCN", Barcelona: "BCN",
  마드리드: "MAD", Madrid: "MAD",
  프랑크푸르트: "FRA", Frankfurt: "FRA",
  뮌헨: "MUC", Munich: "MUC",
  베를린: "BER", Berlin: "BER",
  암스테르담: "AMS", Amsterdam: "AMS",
  비엔나: "VIE", Vienna: "VIE",
  프라하: "PRG", Prague: "PRG",
  취리히: "ZRH", Zurich: "ZRH",
  이스탄불: "IST", Istanbul: "IST",
  헬싱키: "HEL", Helsinki: "HEL",

  // ── 오세아니아·중동·기타 ──
  시드니: "SYD", Sydney: "SYD",
  멜버른: "MEL", Melbourne: "MEL",
  오클랜드: "AKL", Auckland: "AKL",
  두바이: "DXB", Dubai: "DXB",
  도하: "DOH", Doha: "DOH",
};

/** 도시명 → IATA 변환 (매핑 없으면 입력 첫 3글자 대문자 fallback) */
export function resolveIata(city: string): string {
  const trimmed = city.trim();
  if (!trimmed) return "";
  // 정확 일치
  if (CITY_TO_IATA[trimmed]) return CITY_TO_IATA[trimmed];
  // 대소문자 무시 부분 일치
  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(CITY_TO_IATA)) {
    if (key.toLowerCase() === lower) return val;
  }
  // 이미 IATA 코드(3글자) 형태라면 그대로 사용
  if (/^[A-Z]{3}$/.test(trimmed)) return trimmed;
  // fallback: 첫 3글자 대문자
  return trimmed.toUpperCase().slice(0, 3);
}

/** YYYY-MM-DD → YYMMDD (Skyscanner URL용) */
function toYYMMDD(date: string): string {
  return date.replace(/-/g, "").slice(2);
}

/** Trip.com 한국어 검색 URL */
export function buildTripComUrl(p: FlightSearchParams): string {
  const from = resolveIata(p.fromCity);
  const to = resolveIata(p.toCity);
  const adults = Math.max(1, p.adults ?? 1);

  const params = new URLSearchParams({
    dcity: from,
    acity: to,
    ddate: p.departDate,
    class: "Y",
    adult: String(adults),
    locale: "ko-kr",
    curr: "KRW",
  });
  if (p.returnDate) {
    params.set("rdate", p.returnDate);
    params.set("flighttype", "rt"); // round-trip
  } else {
    params.set("flighttype", "ow"); // one-way
  }

  const allianceId = process.env.NEXT_PUBLIC_TRIP_ALLIANCE_ID;
  const sid = process.env.NEXT_PUBLIC_TRIP_SID;
  if (allianceId) params.set("Allianceid", allianceId);
  if (sid) params.set("SID", sid);

  return `https://kr.trip.com/flights/showfarefirst?${params.toString()}`;
}

/** Skyscanner 검색 URL (직접) */
export function buildSkyscannerUrl(p: FlightSearchParams): string {
  const from = resolveIata(p.fromCity).toLowerCase();
  const to = resolveIata(p.toCity).toLowerCase();
  const dep = toYYMMDD(p.departDate);
  const adults = Math.max(1, p.adults ?? 1);
  const path = p.returnDate
    ? `${from}/${to}/${dep}/${toYYMMDD(p.returnDate)}/`
    : `${from}/${to}/${dep}/`;
  return `https://www.skyscanner.co.kr/transport/flights/${path}?adultsv2=${adults}`;
}

/** Travelpayouts (Aviasales/Skyscanner 통합) — marker 유무 자동 처리 */
export function buildTravelpayoutsUrl(p: FlightSearchParams): string {
  const marker = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER;
  const target = buildSkyscannerUrl(p);
  if (!marker) return target; // marker 없으면 직접 Skyscanner로
  // Travelpayouts redirect 게이트웨이 (p=4114 = Skyscanner)
  const tpParams = new URLSearchParams({
    marker,
    p: "4114",
    u: target,
    campaign_id: "100",
  });
  return `https://tp.media/r?${tpParams.toString()}`;
}

/** 두 Affiliate URL 한 번에 가져오기 (UI에서 비교용) */
export function buildSearchUrls(p: FlightSearchParams): {
  tripcom: string;
  skyscanner: string;
} {
  return {
    tripcom: buildTripComUrl(p),
    skyscanner: buildTravelpayoutsUrl(p),
  };
}
