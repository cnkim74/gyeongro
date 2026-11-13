import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { searchSetupStatus, SITE } from "@/lib/search-index";
import SeoChecker, { type SeoPost } from "./SeoChecker";

export const dynamic = "force-dynamic";
export const metadata = { title: "검색 노출 점검 - Pothos" };

export default async function BlogSeoPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  await requireAdmin();
  const kind = (await searchParams).kind === "story" ? "story" : "blog";
  const supabase = getSupabaseServiceClient();
  let posts: SeoPost[] = [];
  if (kind === "blog") {
    const { data } = await supabase.from("blog_posts").select("*").eq("is_published", true).order("published_at", { ascending: false }).limit(200);
    posts = ((data ?? []) as { id: string; slug: string; title: string; published_at: string | null; focus_keyword?: string | null }[]).map((p) => ({
      ...p,
      path: `/blog/${p.slug}`,
      rankKey: p.slug,
      editHref: `/admin/blog/${p.id}`,
    }));
  } else {
    const { data } = await supabase
      .from("stories")
      .select("id, title, created_at")
      .eq("is_published", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(200);
    posts = ((data ?? []) as { id: string; title: string; created_at: string }[]).map((s) => ({
      id: s.id,
      slug: s.id,
      title: s.title,
      published_at: s.created_at,
      focus_keyword: null,
      path: `/stories/${s.id}`,
      rankKey: `story:${s.id}`,
      editHref: `/stories/${s.id}/edit`,
    }));
  }
  return <SeoChecker kind={kind} posts={posts} setup={await searchSetupStatus()} site={SITE} />;
}
