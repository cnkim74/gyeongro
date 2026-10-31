import { ShoppingBag, ExternalLink } from "lucide-react";
import { getActiveProducts, sanitizeSnippet, CATEGORIES, type AffiliateProduct } from "@/lib/affiliate";

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
      <p className="text-[15px] text-gray-500 mb-3">
        여행에 필요한 필수 아이템을 한 번에 준비하세요
      </p>

      {/* 쿠팡 파트너스 필수 표기 — 상단 (정책 준수) */}
      <div className="bg-orange-50/60 border border-orange-100 rounded-xl px-3.5 py-2.5 mb-5">
        <p className="text-sm text-orange-900 leading-relaxed">
          <strong>안내:</strong> 이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에
          따른 일정액의 수수료를 제공받습니다.
        </p>
      </div>

      <div className="space-y-5">
        {Object.entries(grouped).map(([cat, items]) => {
          const c = CATEGORIES[cat] ?? { label: cat, emoji: "🎒" };
          return (
            <div key={cat}>
              <h3 className="text-base font-bold text-gray-700 mb-2">
                {c.emoji} {c.label}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {items.map((p) =>
                  p.html_snippet?.trim() ? (
                    <div
                      key={p.id}
                      className="rounded-xl overflow-hidden bg-gray-50"
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
                          <p className="text-xs text-orange-700/70 font-medium tracking-wide">
                            이미지 준비중
                          </p>
                        </div>
                      )}
                      <p className="text-[15px] font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                        {p.name}
                      </p>
                      {p.price_text && (
                        <p className="text-sm text-orange-600 font-bold mt-1">
                          {p.price_text}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <ExternalLink className="w-3 h-3" />
                        쿠팡
                      </div>
                    </a>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 표기 — 정책상 ''눈에 잘 띄는 위치'' 요구 충족 */}
      <p className="text-sm text-gray-500 mt-5 pt-4 border-t border-gray-100 leading-relaxed">
        ⓘ 본 페이지에 표시된 상품은 쿠팡 파트너스(Coupang Partners) 활동의 일환으로,
        이용자가 링크를 통해 구매할 경우 Pothos는 일정액의 수수료를 제공받습니다.
        가격·재고는 쿠팡 사이트의 실시간 정보가 정확합니다.
      </p>
    </section>
  );
}
