// 블로그 글 저장용 입력 정리 (관리자 API 전용)

import { normalizeFaq, normalizeSlug, isCoverStyle } from "./blog-utils";

function safeImage(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return /^https:\/\//.test(t) || /^\/(?!\/)/.test(t) ? t.slice(0, 500) : null;
}

export function sanitizeBlogInput(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim().slice(0, 150);
  let slug = normalizeSlug(String(body.slug ?? ""));
  if (!slug) slug = `post-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6)}`;
  const tags = (Array.isArray(body.tags) ? body.tags : String(body.tags ?? "").split(","))
    .map((t) => String(t).replace(/^#/, "").trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((t) => t.slice(0, 30));
  const is_published = body.is_published === true;
  return {
    title,
    slug,
    excerpt: String(body.excerpt ?? "").trim().slice(0, 300),
    category: String(body.category ?? "").replace(/^#/, "").trim().slice(0, 30),
    cover_image_url: safeImage(body.cover_image_url),
    content: String(body.content ?? "").slice(0, 100_000),
    tags,
    faq: normalizeFaq(body.faq),
    is_published,
    // 대표 이미지 색 — 화면에서 보낸 경우에만 (자동 작성 컬럼이 없을 때도 저장되도록)
    ...("cover_style" in body ? { cover_style: isCoverStyle(body.cover_style) ? body.cover_style : null } : {}),
  };
}
