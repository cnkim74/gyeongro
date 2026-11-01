import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getAutoSettings } from "@/lib/blog-auto";
import type { BlogPost } from "@/lib/blog";
import BlogDashboard from "./BlogDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "블로그 관리 - Pothos" };

export default async function AdminBlogPage() {
  await requireAdmin();
  let posts: BlogPost[] = [];
  let missing = false;
  try {
    const { data, error } = await getSupabaseServiceClient()
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) missing = true;
    posts = (data ?? []) as BlogPost[];
  } catch {
    missing = true;
  }
  // 자동 작성 컬럼(migration_blog_auto.sql) 실행 여부
  let autoReady = false;
  if (!missing) {
    const { error } = await getSupabaseServiceClient().from("blog_posts").select("naver_draft").limit(1);
    autoReady = !error;
  }
  const settings = await getAutoSettings();
  const cronSecret = !!process.env.CRON_SECRET;

  return (
    <BlogDashboard
      initialPosts={posts}
      initialSettings={settings}
      tableMissing={missing}
      autoReady={autoReady}
      cronSecret={cronSecret}
    />
  );
}
