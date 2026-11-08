// 검색엔진용 사이트맵 (/sitemap.xml) — 주요 페이지 + 공개된 블로그 글

import type { MetadataRoute } from "next";
import { listPublishedPosts } from "@/lib/blog";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://pothostravel.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/planner", "/festivals", "/travel-guide", "/exchange", "/pricing", "/blog", "/stories", "/board", "/themes", "/sherpa", "/medical"];
  const posts = await listPublishedPosts(500);
  // 공개 스토리 (검색에 잘 걸리는 여행 정보 글)
  let stories: { id: string; updated_at?: string | null; created_at: string }[] = [];
  try {
    const { data } = await getSupabaseServiceClient()
      .from("stories")
      .select("id, updated_at, created_at")
      .eq("is_published", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(1000);
    stories = (data ?? []) as typeof stories;
  } catch {
    // 스토리 표가 없거나 오류면 건너뜀
  }
  return [
    ...pages.map((p) => ({ url: `${SITE}${p}`, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.7 })),
    ...posts.map((p) => ({
      url: `${SITE}/blog/${p.slug}`,
      lastModified: (p as { updated_at?: string }).updated_at ?? p.published_at ?? p.created_at,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...stories.map((s) => ({
      url: `${SITE}/stories/${s.id}`,
      lastModified: s.updated_at ?? s.created_at,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
