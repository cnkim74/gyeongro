// 지금 AI로 블로그 글 쓰기 (관리자 전용)
// POST { topic?, publish? } -> { id, slug, title, published, costKrw }

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { getAutoSettings } from "@/lib/blog-auto";
import { writeBlogPost, saveWrittenPost } from "@/lib/blog-writer";
import { KRW_PER_USD } from "@/lib/ai-runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  let body: { topic?: string; publish?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    // 빈 요청 = 주제 AI 선택
  }
  try {
    const settings = await getAutoSettings();
    const post = await writeBlogPost({ topic: String(body.topic ?? "").slice(0, 200), settings, userId: session.user.id });
    const publish = body.publish !== false;
    const saved = await saveWrittenPost(post, { publish, authorId: session.user.id });
    revalidatePath("/blog", "layout");
    return Response.json({
      ...saved,
      title: post.title,
      published: publish,
      costKrw: Math.round(post.costUsd * KRW_PER_USD),
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "글을 쓰지 못했어요." }, { status: 500 });
  }
}
