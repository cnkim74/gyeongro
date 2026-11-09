// 스레드 댓글 — 답글 초안 확인·보내기 (관리자)
import { requireAdmin } from "@/lib/admin";
import { listThreadsComments } from "@/lib/threads-replies";
import { getThreadsConnection } from "@/lib/threads";
import ThreadsReplies from "./ThreadsReplies";

export const dynamic = "force-dynamic";
export const metadata = { title: "스레드 댓글 - Pothos" };

export default async function ThreadsRepliesPage() {
  await requireAdmin();
  const [data, conn] = await Promise.all([listThreadsComments(), getThreadsConnection()]);
  return <ThreadsReplies initial={data} username={conn?.username ?? null} />;
}
