// Pothos 블로그 (여행 인사이트) — 서버 전용 데이터 함수 + 공용 도우미
//
// 글은 Supabase blog_posts 테이블 (supabase/migration_blog.sql)
// 본문은 마크다운: ## 제목 → 목차 자동 생성, 표·목록·이미지·링크 지원

import { getSupabaseServiceClient } from "./supabase";
import type { BlogFaq } from "./blog-utils";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  cover_image_url: string | null;
  content: string;
  tags: string[];
  faq: BlogFaq[];
  is_published: boolean;
  published_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export type BlogCard = Pick<
  BlogPost,
  "id" | "slug" | "title" | "excerpt" | "category" | "cover_image_url" | "published_at" | "created_at" | "content"
>;

const CARD_COLUMNS = "id, slug, title, excerpt, category, cover_image_url, published_at, created_at, content";

/** 공개된 글 목록 (최신순). 테이블이 없으면 빈 목록 */
export async function listPublishedPosts(limit = 60): Promise<BlogCard[]> {
  try {
    const { data, error } = await getSupabaseServiceClient()
      .from("blog_posts")
      .select(CARD_COLUMNS)
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as BlogCard[];
  } catch {
    return [];
  }
}

/** 글 하나 — includeDraft 는 관리자 미리보기용 */
export async function getPost(slug: string, includeDraft = false): Promise<BlogPost | null> {
  try {
    let q = getSupabaseServiceClient().from("blog_posts").select("*").eq("slug", slug);
    if (!includeDraft) q = q.eq("is_published", true);
    const { data } = await q.maybeSingle();
    return (data as BlogPost | null) ?? null;
  } catch {
    return null;
  }
}

/** 다른 글 (같은 카테고리 우선) */
export async function listRelatedPosts(post: BlogPost, limit = 3): Promise<BlogCard[]> {
  const all = await listPublishedPosts(30);
  const others = all.filter((p) => p.id !== post.id);
  const same = others.filter((p) => p.category && p.category === post.category);
  const rest = others.filter((p) => !same.includes(p));
  return [...same, ...rest].slice(0, limit);
}

export async function increaseView(id: string, current: number) {
  try {
    await getSupabaseServiceClient().from("blog_posts").update({ view_count: current + 1 }).eq("id", id);
  } catch {
    // 조회수 실패는 무시
  }
}

export * from "./blog-utils";
