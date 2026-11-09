// 스레드 자동 게시 — 12시 · 18시 · 21시(KST) 시간대 (vercel.json 예약 작업)
// 8시 시간대는 /api/cron/blog 에서 블로그 작성과 함께 실행
// 보안: CRON_SECRET 이 있으면 'Authorization: Bearer <CRON_SECRET>' 필요
import { runThreadsSlot } from "@/lib/threads-auto";
import { checkThreadsReplies } from "@/lib/threads-replies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request, { params }: { params: Promise<{ slot: string }> }) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const slot = Number((await params).slot);
  if (![12, 18, 21].includes(slot)) return Response.json({ error: "unknown slot" }, { status: 400 });
  const result = await runThreadsSlot(slot).catch((e) => ({ error: e instanceof Error ? e.message : String(e) }));
  // 게시 시간대가 아니어도 새 댓글은 확인 (하루 4번)
  const replies = await checkThreadsReplies().catch((e) => ({ error: e instanceof Error ? e.message : String(e) }));
  return Response.json({ slot, result, replies });
}
