// 블로그 글 수정·삭제 (관리자 전용)
// PATCH { ...글 내용 } -> { post } / DELETE -> { ok }

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { sanitizeBlogInput } from "@/lib/blog-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }
  const input = sanitizeBlogInput(body);
  if (!input.title) return Response.json({ error: "제목을 입력해 주세요." }, { status: 400 });

  const supabase = getSupabaseServiceClient();
  const { data: prev } = await supabase.from("blog_posts").select("published_at").eq("id", id).maybeSingle();
  if (!prev) return Response.json({ error: "글을 찾을 수 없어요." }, { status: 404 });

  const { data, error } = await supabase
    .from("blog_posts")
    .update({
      ...input,
      // 처음 공개할 때 공개일 기록 (이미 공개된 글은 유지)
      published_at: input.is_published ? (prev.published_at ?? new Date().toISOString()) : prev.published_at,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    const msg = error.code === "23505" ? "같은 주소(slug)의 글이 이미 있어요. 주소를 바꿔 주세요." : error.message;
    return Response.json({ error: msg }, { status: 400 });
  }
  revalidatePath("/blog", "layout");
  return Response.json({ post: data });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  const { id } = await params;
  const { error } = await getSupabaseServiceClient().from("blog_posts").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  revalidatePath("/blog", "layout");
  return Response.json({ ok: true });
}
