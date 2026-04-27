// 셰르파-여행 매칭 점수 계산
//
// 양방향 동일 지표 사용:
//   - 도시 일치 (40)
//   - 언어 일치 (20)
//   - 전문 분야 일치 (20)
//   - 평점·신뢰도 (10)
//   - 인기도 (5)
//   - 예산 적합 (5)
//
// 결과: 0~100 정수. UI에서 'X% 매칭' 표시 가능.

import { resolveCountry } from "@/lib/advisory";

export interface MatchableSherpa {
  countries: string[];
  cities: string[];
  cities_en?: string[] | null;
  languages: string[];
  specialties: string[];
  rating_avg: number | null;
  rating_count: number;
  booking_count: number;
  full_day_rate_krw: number | null;
  half_day_rate_krw: number | null;
  hourly_rate_krw: number | null;
}

export interface MatchableTrip {
  destination: string;
  sherpa_required_languages: string[] | null;
  sherpa_required_specialties: string[] | null;
  sherpa_budget_max_krw: number | null;
}

export interface MatchBreakdown {
  score: number;       // 0~100
  cityScore: number;   // 0~40
  languageScore: number; // 0~20
  specialtyScore: number; // 0~20
  ratingScore: number; // 0~10
  popularityScore: number; // 0~5
  budgetScore: number; // 0~5
  reasons: string[];   // 가독성용 (예: ['도쿄 활동', '일본어 가능'])
}

export function matchSherpaToTrip(
  sherpa: MatchableSherpa,
  trip: MatchableTrip
): MatchBreakdown {
  const reasons: string[] = [];

  // ---------- City / Country (40) ----------
  let cityScore = 0;
  const dest = trip.destination.toLowerCase();
  const allCities = [
    ...sherpa.cities,
    ...(sherpa.cities_en ?? []),
  ].map((c) => c.toLowerCase());
  const cityMatch = allCities.some(
    (c) =>
      c.length > 0 &&
      (dest.includes(c) || c.includes(dest.split(" ").pop() ?? dest))
  );
  if (cityMatch) {
    cityScore = 40;
    reasons.push(`${sherpa.cities[0] ?? ""} 활동`);
  } else {
    const country = resolveCountry(trip.destination);
    if (country && sherpa.countries.includes(country.countryCode)) {
      cityScore = 20;
      reasons.push(`${country.country} 활동`);
    }
  }

  // ---------- Language (20) ----------
  let languageScore = 0;
  const required = trip.sherpa_required_languages ?? [];
  if (required.length > 0) {
    const matches = required.filter((l) => sherpa.languages.includes(l)).length;
    languageScore = Math.round((matches / required.length) * 20);
    if (matches === required.length) {
      reasons.push("필요 언어 모두 가능");
    } else if (matches > 0) {
      reasons.push(`언어 ${matches}/${required.length}`);
    }
  } else {
    if (sherpa.languages.includes("ko")) {
      languageScore = 20;
    } else {
      languageScore = 10;
    }
  }

  // ---------- Specialty (20) ----------
  let specialtyScore = 0;
  const requiredSpecs = trip.sherpa_required_specialties ?? [];
  if (requiredSpecs.length > 0) {
    const matches = requiredSpecs.filter((s) =>
      sherpa.specialties.includes(s)
    ).length;
    specialtyScore = Math.round((matches / requiredSpecs.length) * 20);
    if (matches === requiredSpecs.length && matches > 0) {
      reasons.push("요구 분야 전부 충족");
    }
  } else {
    specialtyScore = 12;
  }

  // ---------- Rating (10) ----------
  let ratingScore = 0;
  if (sherpa.rating_count > 0) {
    ratingScore = Math.round((Number(sherpa.rating_avg ?? 0) / 5) * 10);
    if (Number(sherpa.rating_avg) >= 4.8 && sherpa.rating_count >= 5) {
      reasons.push("⭐ 우수 평점");
    }
  } else {
    ratingScore = 5; // 신규 셰르파 중립 점수
  }

  // ---------- Popularity (5) ----------
  const popularityScore = Math.min(
    5,
    Math.round(Math.log10(sherpa.booking_count + 1) * 3)
  );
  if (sherpa.booking_count >= 20) {
    reasons.push(`${sherpa.booking_count}건 매칭 경험`);
  }

  // ---------- Budget fit (5) ----------
  let budgetScore = 0;
  const budget = trip.sherpa_budget_max_krw;
  const ref =
    sherpa.full_day_rate_krw ?? sherpa.half_day_rate_krw ?? sherpa.hourly_rate_krw;
  if (budget && ref) {
    if (ref <= budget) {
      budgetScore = 5;
      reasons.push("예산 내");
    } else {
      const overage = (ref - budget) / budget;
      if (overage < 0.2) budgetScore = 3;
      else if (overage < 0.5) budgetScore = 1;
    }
  } else {
    budgetScore = 3;
  }

  const total =
    cityScore +
    languageScore +
    specialtyScore +
    ratingScore +
    popularityScore +
    budgetScore;

  return {
    score: Math.min(100, total),
    cityScore,
    languageScore,
    specialtyScore,
    ratingScore,
    popularityScore,
    budgetScore,
    reasons: reasons.slice(0, 4),
  };
}

export function matchScoreColor(score: number): {
  bg: string;
  text: string;
  label: string;
} {
  if (score >= 80) {
    return { bg: "bg-emerald-500", text: "text-white", label: "최적" };
  }
  if (score >= 60) {
    return { bg: "bg-emerald-100", text: "text-emerald-700", label: "추천" };
  }
  if (score >= 40) {
    return { bg: "bg-amber-100", text: "text-amber-700", label: "보통" };
  }
  return { bg: "bg-slate-100", text: "text-slate-500", label: "낮음" };
}
