import { getSupabaseServiceClient } from "@/lib/supabase";
import { ShoppingBag, ExternalLink } from "lucide-react";

interface AffiliateProduct {
  id: string;
  category: string;
  name: string;
  description: string | null;
  image_url: string | null;
  affiliate_url: string;
  price_text: string | null;
  html_snippet: string | null;
}

// 허용 iframe 도메인 (쿠팡 파트너스 + 추가 가능)
const ALLOWED_IFRAME_HOSTS = [
  "ads-partners.coupang.com",
  "link.coupang.com",
  "www.coupang.com",
  "coupang.com",
];

/**
 * HTML 스니펫에서 허용된 도메인의 iframe·a·img·br·span만 통과시킴.
 * 단순 정규식 화이트리스트 — admin 입력만 받으니 보수적으로.
 */
function sanitizeSnippet(html: string): string {
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

  // 2. iframe 도메인 화이트리스트 검증
  cleaned = cleaned.replace(/<iframe([^>]*)>/gi, (full, attrs: string) => {
    const srcMatch = attrs.match(/src\s*=\s*["']([^"']+)["']/i);
    if (!srcMatch) return ""; // src 없으면 제거
    try {
      const u = new URL(srcMatch[1]);
      if (!ALLOWED_IFRAME_HOSTS.includes(u.hostname)) return ""; // 허용 도메인 아니면 제거
    } catch {
      return "";
    }
    return `<iframe${attrs} loading="lazy" referrerpolicy="no-referrer-when-downgrade">`;
  });

  return cleaned;
}

const CATEGORIES: Record<string, { label: string; emoji: string }> = {
  connectivity: { label: "통신", emoji: "📶" },
  power: { label: "전원·충전", emoji: "🔋" },
  luggage: { label: "캐리어·짐", emoji: "🧳" },
  comfort: { label: "편의용품", emoji: "✨" },
  health: { label: "건강·약품", emoji: "💊" },
  etc: { label: "기타", emoji: "🎒" },
};

async function getActiveProducts(): Promise<AffiliateProduct[]> {
  try {
    const supabase = getSupabaseServiceClient();
    const { data } = await supabase
      .from("affiliate_products")
      .select("id, category, name, description, image_url, affiliate_url, price_text, html_snippet")
      .eq("is_active", true)
      .order("display_order")
      .order("created_at");
    return (data ?? []) as AffiliateProduct[];
  } catch {
    return [];
  }
}

export default async function TravelEssentials() {
  const products = await getActiveProducts();
  if (products.length === 0) return null;

  // 카테고리별로 그룹핑
  const grouped: Record<string, AffiliateProduct[]> = {};
  for (const p of products) {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  }

  return (
    <section className="bg-white rounded-3xl border border-gray-100 p-6 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <ShoppingBag className="w-5 h-5 text-orange-500" />
        <h2 className="font-bold text-gray-900 text-lg">여행 준비물 추천</h2>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        여행에 필요한 필수 아이템을 한 번에 준비하세요
      </p>

      {/* 쿠팡 파트너스 필수 표기 — 상단 (정책 준수) */}
      <div className="bg-orange-50/60 border border-orange-100 rounded-xl px-3.5 py-2.5 mb-5">
        <p className="text-[11px] text-orange-900 leading-relaxed">
          <strong>안내:</strong> 이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에
          따른 일정액의 수수료를 제공받습니다.
        </p>
      </div>

      <div className="space-y-5">
        {Object.entries(grouped).map(([cat, items]) => {
          const c = CATEGORIES[cat] ?? { label: cat, emoji: "🎒" };
          // HTML 스니펫과 일반 카드 분리
          const htmlItems = items.filter((p) => p.html_snippet?.trim());
          const cardItems = items.filter((p) => !p.html_snippet?.trim());
          return (
            <div key={cat}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {c.emoji} {c.label}
              </h3>

              {/* HTML 스니펫 (쿠팡 다이나믹 배너 등) — 위에 풀-와이드로 표시 */}
              {htmlItems.length > 0 && (
                <div className="space-y-2 mb-3">
                  {htmlItems.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl overflow-hidden bg-gray-50"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeSnippet(p.html_snippet ?? ""),
                      }}
                    />
                  ))}
                </div>
              )}

              {/* 일반 상품 카드 */}
              {cardItems.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {cardItems.map((p) => (
                  <a
                    key={p.id}
                    href={p.affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="group bg-gray-50 rounded-xl p-3 hover:bg-orange-50 hover:shadow-md transition-all"
                  >
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full aspect-square object-cover rounded-lg mb-2 bg-white"
                      />
                    ) : (
                      <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex flex-col items-center justify-center mb-2 relative overflow-hidden">
                        <div className="text-4xl mb-1 opacity-90">{c.emoji}</div>
                        <p className="text-[9px] text-orange-700/70 font-medium tracking-wide">
                          이미지 준비중
                        </p>
                      </div>
                    )}
                    <p className="text-xs font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {p.name}
                    </p>
                    {p.price_text && (
                      <p className="text-xs text-orange-600 font-bold mt-1">
                        {p.price_text}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <ExternalLink className="w-3 h-3" />
                      쿠팡
                    </div>
                  </a>
                ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 하단 표기 — 정책상 ''눈에 잘 띄는 위치'' 요구 충족 */}
      <p className="text-[11px] text-gray-500 mt-5 pt-4 border-t border-gray-100 leading-relaxed">
        ⓘ 본 페이지에 표시된 상품은 쿠팡 파트너스(Coupang Partners) 활동의 일환으로,
        이용자가 링크를 통해 구매할 경우 Pothos는 일정액의 수수료를 제공받습니다.
        가격·재고는 쿠팡 사이트의 실시간 정보가 정확합니다.
      </p>
    </section>
  );
}
