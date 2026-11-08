// 요금제·이용권 정의 (서버·클라이언트 공용) — 결제 연동 시 이 목록을 그대로 상품으로 사용

export interface CreditPack {
  id: string;
  name: string;
  credits: number; // 고급 AI 횟수
  price: number; // 원
  validDays: number;
  badge?: string;
  desc: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: "pack-1", name: "1회권", credits: 1, price: 1500, validDays: 30, desc: "일단 고급 AI를 써 보고 싶을 때" },
  { id: "pack-3", name: "3회권", credits: 3, price: 2900, validDays: 90, badge: "가장 인기", desc: "여행 한 번 준비하기 딱 좋은 양" },
  { id: "pack-10", name: "10회권", credits: 10, price: 7900, validDays: 365, desc: "자주 떠나는 여행자 · 가족 여행" },
  { id: "pack-30", name: "30회권", credits: 30, price: 19000, validDays: 365, desc: "크리에이터 · 가이드 · 소규모 여행사" },
];

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: "month" | "year";
  monthlyCredits: number;
  note?: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: "plus-month", name: "플러스 월간", price: 4900, period: "month", monthlyCredits: 30 },
  { id: "plus-year", name: "플러스 연간", price: 39000, period: "year", monthlyCredits: 30, note: "월 3,250원꼴 · 약 34% 할인" },
];

export const PLUS_BENEFITS = [
  "고급 AI 월 30회",
  "광고 없는 화면",
  "Pothos 표기 없는 깔끔한 PDF 일정표",
  "관심 지역 축제·박람회 등록 알림",
  "저장한 여행지 여행경보·환율 변동 알림",
];

/** 결제 기능이 열렸는지 — 결제 연동 전에는 '준비 중' 표시 */
export const PAYMENTS_ENABLED = false;

export function won(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}
