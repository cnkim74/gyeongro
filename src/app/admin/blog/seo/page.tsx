import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { searchSetupStatus, SITE } from "@/lib/search-index";
import SeoChecker from "./SeoChecker";

export const dynamic = "force-dynamic";
export const metadata = { title: "검색 노출 점검 - Pothos" };

export default async function BlogSeoPage() {
  await requireAdmin();
  const { data } = await getSupabaseServiceClient()
    .from("blog_posts")
    .select("id, slug, title, is_published, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(200);
  return (
    <SeoChecker
      posts={(data ?? []) as { id: string; slug: string; title: string; published_at: string | null }[]}
      setup={await searchSetupStatus()}
      site={SITE}
    />
  );
}
