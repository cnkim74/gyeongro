// 블로그 댓글 지우기 (쓴 사람 · 글쓴이 · 관리자)
import { handleCommentDelete } from "@/lib/comments-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleCommentDelete("blog", id, req);
}
