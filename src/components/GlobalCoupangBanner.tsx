// 전체 페이지 푸터 위에 노출되는 어필리에이트 배너
//
// is_global=true 인 affiliate_products row를 모두 가져와 렌더링.
// HTML 스니펫이 있으면 iframe 그대로 (sanitize 적용),
// 없으면 단순 image+텍스트 카드로.
//
// 사용:
//   <GlobalCoupangBanner />
//   (Footer 컴포넌트 상단에 자동 포함됨)

import { getSupabaseServiceClient } from "@/lib/supabase";

interface GlobalProduct {
  id: string;
  name: string;
  image_url: string | null;
  affiliate_url: string;
  price_text: string | null;
  html_snippet: string | null;
}

const ALLOWED_IFRAME_DOMAINS = ["coupang.com", "coupangcdn.com"];

function isAllowedIframeHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return ALLOWED_IFRAME_DOMAINS.some((d) => h === d || h.endsWith("." + d));
}

function sanitizeSnippet(html: string): string {
  if (!html) return "";
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<input[^>]*>/gi, "")
    .replace(/<meta[^>]*>/gi, "");

  cleaned = cleaned.replace(/<iframe[^>]*>/gi, (full: string) => {
    const srcMatch = full.match(/src\s*=\s*["']([^"']+)["']/i);
    if (!srcMatch) return "";
    try {
      const u = new URL(srcMatch[1]);
      if (!isAllowedIframeHost(u.hostname)) return "";
    } catch {
      return "";
    }
    return full;
  });

  return cleaned;
}

async function getGlobalProducts(): Promise<GlobalProduct[]> {
  try {
    const supabase = getSupabaseServiceClient();
    const { data } = await supabase
      .from("affiliate_products")
      .select("id, name, image_url, affiliate_url, price_text, html_snippet")
      .eq("is_global", true)
      .eq("is_active", true)
      .order("display_order")
      .limit(3); // 안전을 위해 3개로 제한
    return (data ?? []) as GlobalProduct[];
  } catch {
    return [];
  }
}

export default async function GlobalCoupangBanner() {
  const products = await getGlobalProducts();
  if (products.length === 0) return null;

  return (
    <div className="bg-orange-50/40 border-t border-orange-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* 쿠팡 파트너스 필수 표기 */}
        <p className="text-[10px] text-orange-900/70 mb-2">
          <strong>쿠팡 파트너스</strong> · 이 포스팅에 일부 링크는 쿠팡
          파트너스 활동의 일환으로, Pothos는 이에 따른 일정액의 수수료를 제공받습니다.
        </p>

        <div className="space-y-2">
          {products.map((p) =>
            p.html_snippet?.trim() ? (
              <div
                key={p.id}
                className="rounded-xl overflow-hidden bg-white"
                dangerouslySetInnerHTML={{
                  __html: sanitizeSnippet(p.html_snippet),
                }}
              />
            ) : (
              <a
                key={p.id}
                href={p.affiliate_url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center gap-3 bg-white rounded-xl p-3 hover:shadow-md transition-shadow border border-orange-100"
              >
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-16 h-16 rounded-lg object-cover bg-slate-50 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-orange-100 flex items-center justify-center text-2xl shrink-0">
                    🛍️
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                    {p.name}
                  </p>
                  {p.price_text && (
                    <p className="text-sm text-orange-600 font-bold mt-0.5">
                      {p.price_text}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    쿠팡에서 보기 →
                  </p>
                </div>
              </a>
            )
          )}
        </div>
      </div>
    </div>
  );
}
