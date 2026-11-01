// 블로그 글 만들기 (관리자 전용)
// POST { title, slug, excerpt, category, cover_image_url, content, tags, faq, is_published } -> { post }

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { sanitizeBlogInput } from "@/lib/blog-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }
  const input = sanitizeBlogInput(body);
  if (!input.title) return Response.json({ error: "제목을 입력해 주세요." }, { status: 400 });

  const { data, error } = await getSupabaseServiceClient()
    .from("blog_posts")
    .insert({
      ...input,
      author_id: session.user.id,
      published_at: input.is_published ? new Date().toISOString() : null,
    })
    .select("*")
    .single();
  if (error) {
    const msg = error.code === "23505" ? "같은 주소(slug)의 글이 이미 있어요. 주소를 바꿔 주세요." : error.message;
    return Response.json({ error: msg }, { status: 400 });
  }
  revalidatePath("/blog", "layout");
  return Response.json({ post: data });
}
