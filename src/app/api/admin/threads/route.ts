// 스레드 관리 (관리자) — POST { action: "disconnect" } | { action: "post", postId } | { action: "preview", voice, custom }
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { disconnectThreads } from "@/lib/threads";
import { postBlogWithVoice, previewThreadsText } from "@/lib/threads-auto";
import { isThreadsVoice } from "@/lib/threads-voice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { action?: string; postId?: string; voice?: string; custom?: string };
  if (body.action === "disconnect") {
    await disconnectThreads();
    return Response.json({ ok: true });
  }
  if (body.action === "post" && body.postId) {
    const r = await postBlogWithVoice(body.postId);
    revalidatePath("/admin/blog");
    return r.ok ? Response.json(r) : Response.json({ error: r.error }, { status: 400 });
  }
  if (body.action === "preview") {
    try {
      const r = await previewThreadsText({
        voice: isThreadsVoice(body.voice) ? body.voice : "friend",
        custom: String(body.custom ?? "").slice(0, 300),
      });
      return Response.json(r);
    } catch (e) {
      return Response.json({ error: e instanceof Error ? e.message : "미리보기 실패" }, { status: 400 });
    }
  }
  return Response.json({ error: "알 수 없는 요청" }, { status: 400 });
}
