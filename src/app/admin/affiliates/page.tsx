import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import AffiliateManager from "./AffiliateManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "쿠팡 파트너스 관리 - Pothos",
};

export default async function AdminAffiliatesPage() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  const { data: products } = await supabase
    .from("affiliate_products")
    .select("*")
    .order("display_order")
    .order("created_at");

  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">쿠팡 파트너스 관리</h1>
      <p className="text-sm text-gray-500 mb-6">
        여행 준비물 추천 카드에 표시될 쿠팡 파트너스 링크를 관리합니다.
      </p>
      <AffiliateManager initialProducts={products ?? []} />
    </div>
  );
}
