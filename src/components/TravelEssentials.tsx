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
      .select("id, category, name, description, image_url, affiliate_url, price_text")
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
      <p className="text-xs text-gray-400 mb-5">
        여행에 필요한 필수 아이템을 한 번에 준비하세요
      </p>

      <div className="space-y-5">
        {Object.entries(grouped).map(([cat, items]) => {
          const c = CATEGORIES[cat] ?? { label: cat, emoji: "🎒" };
          return (
            <div key={cat}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {c.emoji} {c.label}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {items.map((p) => (
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
                        className="w-full aspect-square object-cover rounded-lg mb-2"
                      />
                    ) : (
                      <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center text-3xl mb-2">
                        {c.emoji}
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
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-400 mt-5 pt-4 border-t border-gray-100 leading-relaxed">
        본 페이지의 일부 링크는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </p>
    </section>
  );
}
