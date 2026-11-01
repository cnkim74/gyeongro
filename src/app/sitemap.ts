// 검색엔진용 사이트맵 (/sitemap.xml) — 주요 페이지 + 공개된 블로그 글

import type { MetadataRoute } from "next";
import { listPublishedPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://pothostravel.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/planner", "/festivals", "/travel-guide", "/blog", "/stories", "/board", "/themes", "/sherpa", "/medical"];
  const posts = await listPublishedPosts(500);
  return [
    ...pages.map((p) => ({ url: `${SITE}${p}`, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.7 })),
    ...posts.map((p) => ({
      url: `${SITE}/blog/${p.slug}`,
      lastModified: p.published_at ?? p.created_at,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
