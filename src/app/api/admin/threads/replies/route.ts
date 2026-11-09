// 스레드 댓글 관리 (관리자)
// GET -> { lastChecked, items }
// POST { action: "refresh" } | { action: "send", id, text } | { action: "skip", id } | { action: "redraft", id }
import { requireAdmin } from "@/lib/admin";
import { checkThreadsReplies, listThreadsComments, redraftThreadsComment, sendThreadsReply, skipThreadsComment } from "@/lib/threads-replies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  if (!(await requireAdmin())) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  return Response.json(await listThreadsComments());
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { action?: string; id?: string; text?: string };
  try {
    if (body.action === "refresh") return Response.json(await checkThreadsReplies());
    if (body.action === "send" && body.id) {
      await sendThreadsReply(body.id, String(body.text ?? ""));
      return Response.json({ ok: true });
    }
    if (body.action === "skip" && body.id) {
      await skipThreadsComment(body.id);
      return Response.json({ ok: true });
    }
    if (body.action === "redraft" && body.id) return Response.json({ draft: await redraftThreadsComment(body.id) });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "실패" }, { status: 400 });
  }
  return Response.json({ error: "알 수 없는 요청" }, { status: 400 });
}
