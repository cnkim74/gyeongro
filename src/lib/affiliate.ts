// 쿠팡 파트너스 상품 — 서버 전용 공용 코드 (여행 준비물·여행 준비 가이드에서 사용)
//
// 상품은 관리자 '쿠팡 파트너스' 메뉴에서 등록 (affiliate_products)
// 쿠팡 파트너스 정책: 상품 링크 근처에 '수수료를 제공받는다'는 안내를 눈에 띄게 표시해야 함

import { getSupabaseServiceClient } from "./supabase";

export const COUPANG_DISCLOSURE =
  "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";

export interface AffiliateProduct {
  id: string;
  category: string;
  name: string;
  description: string | null;
  image_url: string | null;
  affiliate_url: string;
  price_text: string | null;
  html_snippet: string | null;
}

// 허용 iframe 호스트 — 쿠팡 관련 모든 도메인
const ALLOWED_IFRAME_DOMAINS = [
  "coupang.com", // www.coupang.com, link.coupang.com 등
  "coupangcdn.com", // 이미지 CDN
  "coupa.ng", // 쿠팡 단축 URL (https://coupa.ng/...)
];

function isAllowedIframeHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return ALLOWED_IFRAME_DOMAINS.some(
    (d) => h === d || h.endsWith("." + d)
  );
}

/**
 * HTML 스니펫에서 허용된 도메인의 iframe·a·img·br·span만 통과시킴.
 * 원본 iframe 태그는 그대로 유지(속성 보존), src 도메인만 검증.
 */
export function sanitizeSnippet(html: string): string {
  if (!html) return "";

  // 1. 위험한 태그·속성 우선 제거
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // onclick, onload 등
    .replace(/javascript:/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<input[^>]*>/gi, "")
    .replace(/<meta[^>]*>/gi, "");

  // 2. iframe 도메인 검증 — 원본 태그 그대로 유지 (속성 보존)
  cleaned = cleaned.replace(/<iframe[^>]*>/gi, (full: string) => {
    const srcMatch = full.match(/src\s*=\s*["']([^"']+)["']/i);
    if (!srcMatch) return ""; // src 없으면 제거
    try {
      const u = new URL(srcMatch[1]);
      if (!isAllowedIframeHost(u.hostname)) return ""; // 허용 도메인 아니면 제거
    } catch {
      return "";
    }
    return full; // 원본 그대로
  });

  return cleaned;
}

export const CATEGORIES: Record<string, { label: string; emoji: string }> = {
  connectivity: { label: "통신", emoji: "📶" },
  power: { label: "전원·충전", emoji: "🔋" },
  luggage: { label: "캐리어·짐", emoji: "🧳" },
  comfort: { label: "편의용품", emoji: "✨" },
  health: { label: "건강·약품", emoji: "💊" },
  etc: { label: "기타", emoji: "🎒" },
};

export async function getActiveProducts(): Promise<AffiliateProduct[]> {
  try {
    const supabase = getSupabaseServiceClient();
    const { data } = await supabase
      .from("affiliate_products")
      .select("id, category, name, description, image_url, affiliate_url, price_text, html_snippet")
      .eq("is_active", true)
      .order("display_order")
      .order("created_at");
    // 링크가 아직 '#' 같은 자리표시자인 상품은 숨김 (쿠팡 위젯 HTML 이 있으면 표시)
    return ((data ?? []) as AffiliateProduct[]).filter(
      (p) => !!p.html_snippet?.trim() || /^https?:\/\//.test(p.affiliate_url ?? "")
    );
  } catch {
    return [];
  }
}

