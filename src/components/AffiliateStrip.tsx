// 쿠팡 파트너스 상품 가로 목록 — 여행 준비 가이드 주제별 추천 준비물
// 서버 컴포넌트: 상품 목록은 페이지에서 한 번 조회해 넘겨받음

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { CATEGORIES, COUPANG_DISCLOSURE, sanitizeSnippet, type AffiliateProduct } from "@/lib/affiliate";

export default function AffiliateStrip({
  products,
  title = "함께 챙기면 좋은 준비물",
}: {
  products: AffiliateProduct[];
  title?: string;
}) {
  if (products.length === 0) return null;
  return (
    <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-orange-500" /> {title}
        </h3>
        <Link href="/preparations" className="shrink-0 text-sm font-semibold text-orange-600">
          전체 보기 →
        </Link>
      </div>
      {/* 쿠팡 파트너스 필수 안내 — 링크 바로 위 */}
      <p className="text-sm text-orange-900/80 mb-3">{COUPANG_DISCLOSURE}</p>

      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {products.map((p) => {
          const c = CATEGORIES[p.category] ?? { label: p.category, emoji: "🎒" };
          return p.html_snippet?.trim() ? (
            <div
              key={p.id}
              className="shrink-0 w-40 rounded-xl overflow-hidden bg-white border border-gray-100"
              dangerouslySetInnerHTML={{ __html: sanitizeSnippet(p.html_snippet) }}
            />
          ) : (
            <a
              key={p.id}
              href={p.affiliate_url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="group shrink-0 w-40 bg-white rounded-xl p-2.5 border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all"
            >
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt={p.name} className="w-full aspect-square object-cover rounded-lg mb-2 bg-gray-50" loading="lazy" />
              ) : (
                <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-4xl mb-2">
                  {c.emoji}
                </div>
              )}
              <p className="text-[15px] font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-orange-600">{p.name}</p>
              {p.price_text && <p className="text-sm text-orange-600 font-bold mt-1">{p.price_text}</p>}
              <p className="text-xs text-gray-400 mt-1">쿠팡에서 보기</p>
            </a>
          );
        })}
      </div>
    </div>
  );
}
