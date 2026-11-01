// 블로그 글 빠른 변경 (관리자 전용) — 발행/발행 취소, 네이버 올림 표시, 대표 이미지 색·사진
// PATCH { is_published?, naver_posted?, cover_style?, cover_image_url? } -> { post }

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { isCoverStyle } from "@/lib/blog-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }
  const supabase = getSupabaseServiceClient();
  const { data: prev } = await supabase.from("blog_posts").select("published_at").eq("id", id).maybeSingle();
  if (!prev) return Response.json({ error: "글을 찾을 수 없어요." }, { status: 404 });

  const patch: Record<string, unknown> = {};
  if (typeof body.is_published === "boolean") {
    patch.is_published = body.is_published;
    if (body.is_published && !prev.published_at) patch.published_at = new Date().toISOString();
  }
  if (typeof body.naver_posted === "boolean") patch.naver_posted = body.naver_posted;
  if ("cover_style" in body) patch.cover_style = isCoverStyle(body.cover_style) ? body.cover_style : null;
  if ("cover_image_url" in body) {
    const u = typeof body.cover_image_url === "string" ? body.cover_image_url.trim() : "";
    patch.cover_image_url = /^https:\/\//.test(u) || /^\/(?!\/)/.test(u) ? u.slice(0, 500) : null;
  }
  if (Object.keys(patch).length === 0) return Response.json({ error: "바꿀 내용이 없어요." }, { status: 400 });

  const { data, error } = await supabase.from("blog_posts").update(patch).eq("id", id).select("*").single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  revalidatePath("/blog", "layout");
  return Response.json({ post: data });
}
