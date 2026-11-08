// 블로그 댓글 쓰기 — POST { postId, content, isPrivate?, parentId? } -> { id }
import { handleCommentPost } from "@/lib/comments-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handleCommentPost("blog", req);
}
