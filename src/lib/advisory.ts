// 나라별 여행 주의사항 — 외교부 여행경보(2026 기준) 가이드 + 일반 안전수칙 큐레이션
// 데이터는 정기 점검이 필요합니다. 출처는 footer에 표기.

export type AdvisoryLevel = "safe" | "caution" | "warning" | "restricted";

export interface CountryAdvisory {
  country: string;          // 한글 국가명
  countryCode: string;      // ISO-3166 alpha-2
  level: AdvisoryLevel;
  levelLabel: string;       // 단계 표기 (예: 1단계 여행유의)
  summary: string;          // 한 줄 요약
  notes: string[];          // 주요 주의사항 bullets
  emergency: { police?: string; ambulance?: string; embassy?: string };
  visa?: string;            // 비자/입국
  health?: string;          // 보건/예방접종
  currency?: string;        // 통화
  timezone?: string;        // 시간대 표기 (예: UTC+9)
  // 날씨 조회용 좌표 (수도/대표 도시)
  capital: { name: string; lat: number; lon: number };
}

const KOREA: CountryAdvisory = {
  country: "대한민국",
  countryCode: "KR",
  level: "safe",
  levelLabel: "여행경보 없음",
  summary: "치안이 우수한 국내 여행지입니다. 자연재해·해양 안전에 유의하세요.",
  notes: [
    "여름철 태풍·집중호우 시 기상특보 확인",
    "산행/해수욕 시 구역 안내·물때표 확인",
    "응급 시 119(구급), 112(경찰)",
  ],
  emergency: { police: "112", ambulance: "119" },
  visa: "내국인 별도 절차 없음",
  currency: "KRW (₩)",
  timezone: "UTC+9",
  capital: { name: "Seoul", lat: 37.5665, lon: 126.978 },
};

const JAPAN: CountryAdvisory = {
  country: "일본",
  countryCode: "JP",
  level: "safe",
  levelLabel: "여행경보 없음 (일부 지역 1단계)",
  summary: "치안은 양호하나 지진·태풍 등 자연재해 대비가 필요합니다.",
  notes: [
    "지진 발생 시 J-Alert·NHK 안내 확인, 책상 밑 대피",
    "태풍 시즌(6~10월) 항공편·열차 결항 가능",
    "현금 결제 비중 여전히 높음 (소액 IC카드 권장)",
    "후쿠시마 일부 지역 1단계 여행유의 유지",
  ],
  emergency: { police: "110", ambulance: "119", embassy: "+81-3-3455-2601" },
  visa: "K-ETA 불필요, 90일 무비자",
  currency: "JPY (¥)",
  timezone: "UTC+9",
  capital: { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
};

const THAILAND: CountryAdvisory = {
  country: "태국",
  countryCode: "TH",
  level: "caution",
  levelLabel: "1단계 여행유의 (남부 일부 2단계)",
  summary: "관광지 치안은 양호하나 소매치기·약물 권유에 주의하세요.",
  notes: [
    "방콕 카오산·파타야 야간 단독 보행 자제",
    "툭툭/택시 미터제 확인, 그랩 권장",
    "남부 4개 주(나라티왓·파타니·얄라·송클라)는 2단계 자제",
    "전자담배·대마는 한국법 적용 — 소지 금지",
  ],
  emergency: { police: "191", ambulance: "1669", embassy: "+66-2-247-7537" },
  visa: "60일 무비자 (관광)",
  currency: "THB (฿)",
  timezone: "UTC+7",
  capital: { name: "Bangkok", lat: 13.7563, lon: 100.5018 },
};

const FRANCE: CountryAdvisory = {
  country: "프랑스",
  countryCode: "FR",
  level: "caution",
  levelLabel: "1단계 여행유의",
  summary: "관광지 소매치기·집시 사기 빈발. 테러 경계 단계 유지 중.",
  notes: [
    "샹젤리제·에펠탑·몽마르트 소매치기 다발",
    "지하철 1·4·9호선 가방 앞으로 메기",
    "서명 받기·반지 놓기 사기 무시",
    "응급 통합번호 112 (EU 공통)",
  ],
  emergency: { police: "17", ambulance: "15", embassy: "+33-1-4753-0101" },
  visa: "쉥겐 90일 무비자, 2026년부터 ETIAS 사전승인 필요",
  currency: "EUR (€)",
  timezone: "UTC+1 (서머타임 UTC+2)",
  capital: { name: "Paris", lat: 48.8566, lon: 2.3522 },
};

const USA: CountryAdvisory = {
  country: "미국",
  countryCode: "US",
  level: "caution",
  levelLabel: "1단계 여행유의 (도시별 상이)",
  summary: "주별 법령 차이가 큽니다. ESTA 사전승인 필수.",
  notes: [
    "ESTA 또는 비자 필수, 입국 심사 까다로움",
    "대도시 다운타운 야간 보행 자제",
    "총기 사고 대비 — 'Run · Hide · Fight' 원칙",
    "팁 문화 (식당 18~20%)",
  ],
  emergency: { police: "911", ambulance: "911", embassy: "+1-202-939-5660" },
  visa: "ESTA 사전승인 필수 (90일 무비자)",
  currency: "USD ($)",
  timezone: "UTC-5 ~ UTC-10",
  capital: { name: "New York", lat: 40.7128, lon: -74.006 },
};

const VIETNAM: CountryAdvisory = {
  country: "베트남",
  countryCode: "VN",
  level: "caution",
  levelLabel: "1단계 여행유의",
  summary: "교통사고·오토바이 절도에 유의하세요.",
  notes: [
    "도보 시 천천히 일정 속도로 — 스쿠터가 피해갑니다",
    "그랩 사용 권장, 미터기 택시는 'Vinasun/Mailinh'",
    "수돗물 음용 금지, 생수 사용",
    "현금 위주 — 큰 액수는 분산 휴대",
  ],
  emergency: { police: "113", ambulance: "115", embassy: "+84-24-3831-5111" },
  visa: "45일 무비자 (관광)",
  currency: "VND (₫)",
  timezone: "UTC+7",
  capital: { name: "Hanoi", lat: 21.0285, lon: 105.8542 },
};

const ITALY: CountryAdvisory = {
  country: "이탈리아",
  countryCode: "IT",
  level: "caution",
  levelLabel: "1단계 여행유의",
  summary: "로마·밀라노·피렌체 관광지 소매치기 매우 빈번.",
  notes: [
    "지하철·버스·콜로세움 인근 소매치기 주의",
    "위조 명품·서명사기 무시",
    "ZTL(차량 통제구역) 진입 시 자동 벌금",
    "쉥겐 90일 무비자, 2026년부터 ETIAS 필요",
  ],
  emergency: { police: "112", ambulance: "118", embassy: "+39-06-802461" },
  visa: "쉥겐 90일 무비자, ETIAS 사전승인 필요",
  currency: "EUR (€)",
  timezone: "UTC+1 (서머타임 UTC+2)",
  capital: { name: "Rome", lat: 41.9028, lon: 12.4964 },
};

const UK: CountryAdvisory = {
  country: "영국",
  countryCode: "GB",
  level: "caution",
  levelLabel: "1단계 여행유의",
  summary: "ETA 사전승인 필수. 도심 자전거·전동킥보드 사고 주의.",
  notes: [
    "런던·맨체스터 등 주요 도시 ETA 필수 (£10)",
    "좌측통행 — 횡단 시 양방향 확인",
    "지하철 분실주의, 펍에서 가방 무인 보관 금지",
    "응급 통합 999 또는 112",
  ],
  emergency: { police: "999", ambulance: "999", embassy: "+44-20-7227-5500" },
  visa: "ETA 사전승인 필수 (£10), 6개월 무비자",
  currency: "GBP (£)",
  timezone: "UTC+0 (서머타임 UTC+1)",
  capital: { name: "London", lat: 51.5074, lon: -0.1278 },
};

const CHINA: CountryAdvisory = {
  country: "중국",
  countryCode: "CN",
  level: "caution",
  levelLabel: "1단계 여행유의 (티벳·신장 2단계)",
  summary: "VPN·결제 환경 차이 — 출국 전 준비 필수.",
  notes: [
    "Google·카카오·네이버 등 차단 — VPN 또는 로밍",
    "현금/신용카드보다 위챗페이·알리페이가 표준",
    "사진 촬영 금지 구역 다수 (군사·정부 시설)",
    "정치적 발언·전단·SNS 게시 주의",
  ],
  emergency: { police: "110", ambulance: "120", embassy: "+86-10-8531-0700" },
  visa: "15일 무비자 (관광, 2025~ 시범 연장 적용)",
  currency: "CNY (¥)",
  timezone: "UTC+8",
  capital: { name: "Beijing", lat: 39.9042, lon: 116.4074 },
};

const TAIWAN: CountryAdvisory = {
  country: "대만",
  countryCode: "TW",
  level: "safe",
  levelLabel: "여행경보 없음",
  summary: "치안 양호. 지진·태풍 시즌 기상특보 확인 권장.",
  notes: [
    "이지카드(EasyCard)로 대중교통·편의점 결제 편리",
    "6~10월 태풍 시즌 기상청 확인",
    "흡연 구역 외 흡연 시 벌금 NT$2,000~10,000",
  ],
  emergency: { police: "110", ambulance: "119", embassy: "+886-2-2758-8320" },
  visa: "90일 무비자",
  currency: "TWD (NT$)",
  timezone: "UTC+8",
  capital: { name: "Taipei", lat: 25.033, lon: 121.5654 },
};

const SPAIN: CountryAdvisory = {
  country: "스페인",
  countryCode: "ES",
  level: "caution",
  levelLabel: "1단계 여행유의",
  summary: "바르셀로나 람블라스·마드리드 솔 광장 소매치기 다발.",
  notes: [
    "지하철·관광지에서 가방·휴대폰 주의",
    "노상 식당 의자에 가방 걸어두지 말 것",
    "쉥겐 90일 무비자, 2026년부터 ETIAS",
  ],
  emergency: { police: "091", ambulance: "061", embassy: "+34-91-353-2000" },
  visa: "쉥겐 90일 무비자, ETIAS 필요",
  currency: "EUR (€)",
  timezone: "UTC+1 (서머타임 UTC+2)",
  capital: { name: "Madrid", lat: 40.4168, lon: -3.7038 },
};

const SINGAPORE: CountryAdvisory = {
  country: "싱가포르",
  countryCode: "SG",
  level: "safe",
  levelLabel: "여행경보 없음",
  summary: "치안 우수. 엄격한 법률·벌금에 유의하세요.",
  notes: [
    "껌·전자담배·대마 반입 금지 (벌금/구금)",
    "지하철 음식물 섭취 시 벌금 S$30",
    "흡연 시 지정 장소 외 벌금 S$200",
  ],
  emergency: { police: "999", ambulance: "995", embassy: "+65-6256-1188" },
  visa: "90일 무비자, SG Arrival Card 사전 등록",
  currency: "SGD (S$)",
  timezone: "UTC+8",
  capital: { name: "Singapore", lat: 1.3521, lon: 103.8198 },
};

export const COUNTRY_ADVISORIES: Record<string, CountryAdvisory> = {
  KR: KOREA,
  JP: JAPAN,
  TH: THAILAND,
  FR: FRANCE,
  US: USA,
  VN: VIETNAM,
  IT: ITALY,
  GB: UK,
  CN: CHINA,
  TW: TAIWAN,
  ES: SPAIN,
  SG: SINGAPORE,
};

// 도시/지역 → 국가코드 매핑 (한글/영문 키워드)
const DESTINATION_KEYWORDS: Array<{ keywords: string[]; code: string }> = [
  { keywords: ["제주", "부산", "강릉", "경주", "여수", "전주", "서울", "한국", "대한민국", "korea", "seoul", "jeju"], code: "KR" },
  { keywords: ["도쿄", "오사카", "교토", "후쿠오카", "삿포로", "오키나와", "나고야", "일본", "tokyo", "osaka", "kyoto", "japan"], code: "JP" },
  { keywords: ["방콕", "치앙마이", "푸켓", "파타야", "끄라비", "태국", "bangkok", "phuket", "thailand"], code: "TH" },
  { keywords: ["파리", "니스", "마르세유", "리옹", "프랑스", "paris", "france"], code: "FR" },
  { keywords: ["뉴욕", "la", "los angeles", "샌프란시스코", "라스베이거스", "하와이", "괌", "사이판", "미국", "usa", "new york"], code: "US" },
  { keywords: ["하노이", "호치민", "다낭", "나트랑", "호이안", "푸꾸옥", "베트남", "hanoi", "danang", "vietnam"], code: "VN" },
  { keywords: ["로마", "밀라노", "피렌체", "베네치아", "나폴리", "이탈리아", "rome", "milan", "italy"], code: "IT" },
  { keywords: ["런던", "에든버러", "맨체스터", "영국", "london", "uk", "united kingdom"], code: "GB" },
  { keywords: ["베이징", "상하이", "광저우", "청두", "시안", "중국", "beijing", "shanghai", "china"], code: "CN" },
  { keywords: ["타이베이", "타이중", "가오슝", "대만", "taipei", "taiwan"], code: "TW" },
  { keywords: ["바르셀로나", "마드리드", "세비야", "이비자", "스페인", "barcelona", "madrid", "spain"], code: "ES" },
  { keywords: ["싱가포르", "singapore"], code: "SG" },
];

export function resolveCountry(destination: string): CountryAdvisory | null {
  if (!destination) return null;
  const lower = destination.toLowerCase();
  for (const { keywords, code } of DESTINATION_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k.toLowerCase()))) {
      return COUNTRY_ADVISORIES[code] ?? null;
    }
  }
  return null;
}

export const ADVISORY_LEVEL_META: Record<
  AdvisoryLevel,
  { label: string; color: string; bg: string; border: string; ring: string }
> = {
  safe: {
    label: "안전",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    ring: "ring-emerald-500/20",
  },
  caution: {
    label: "여행유의",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    ring: "ring-amber-500/20",
  },
  warning: {
    label: "여행자제",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    ring: "ring-orange-500/20",
  },
  restricted: {
    label: "출국권고/금지",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    ring: "ring-red-500/20",
  },
};
