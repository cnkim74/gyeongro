// 게시판 댓글 쓰기 — 회원 또는 비회원(이름·비밀번호·이메일 선택)
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { checkGuest, isMissingGuestColumns, type GuestInput } from "@/lib/guest-comment";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const { id: postId } = await params;
  const body = (await req.json().catch(() => ({}))) as GuestInput & { content?: string };
  const content = String(body.content ?? "").trim();
  if (!content) return Response.json({ error: "내용을 입력해주세요." }, { status: 400 });
  if (content.length > 2000) return Response.json({ error: "2,000자 이내로 써 주세요." }, { status: 400 });

  const supabase = getSupabaseServiceClient();
  let guest: Record<string, unknown> = {};
  if (!userId) {
    const g = await checkGuest(req, "comments", body, content);
    if (!g.ok) return g.res;
    guest = g.fields;
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, user_id: userId, content, ...guest })
    .select("id")
    .single();

  if (error) {
    if (!userId && isMissingGuestColumns(error.message)) {
      return Response.json({ error: "비회원 댓글은 준비 중이에요. 로그인하고 남겨 주세요." }, { status: 500 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ id: data.id });
}
