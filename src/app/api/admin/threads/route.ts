// 스레드 관리 (관리자) — POST { action: "disconnect" } | { action: "post", postId }
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { disconnectThreads, postBlogToThreads } from "@/lib/threads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { action?: string; postId?: string };
  if (body.action === "disconnect") {
    await disconnectThreads();
    return Response.json({ ok: true });
  }
  if (body.action === "post" && body.postId) {
    const r = await postBlogToThreads(body.postId);
    revalidatePath("/admin/blog");
    return r.ok ? Response.json(r) : Response.json({ error: r.error }, { status: 400 });
  }
  return Response.json({ error: "알 수 없는 요청" }, { status: 400 });
}
