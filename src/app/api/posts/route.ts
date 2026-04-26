import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const body = await req.json();
  const { title, content, board_id } = body;

  if (!title?.trim() || !content?.trim()) {
    return Response.json({ error: "제목과 내용을 입력해주세요." }, { status: 400 });
  }
  if (!board_id) {
    return Response.json({ error: "게시판이 지정되지 않았어요." }, { status: 400 });
  }
  if (title.length > 200) {
    return Response.json({ error: "제목은 200자 이하로 입력해주세요." }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  const { data: board } = await supabase
    .from("boards")
    .select("id, is_admin_only, is_published")
    .eq("id", board_id)
    .single();

  if (!board || !board.is_published) {
    return Response.json({ error: "유효하지 않은 게시판입니다." }, { status: 400 });
  }

  if (board.is_admin_only) {
    const adminFlag = await isAdmin(session.user.id);
    if (!adminFlag) {
      return Response.json(
        { error: "이 게시판은 관리자만 작성할 수 있어요." },
        { status: 403 }
      );
    }
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: session.user.id,
      title: title.trim(),
      content: content.trim(),
      board_id,
    })
    .select("id")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // post_count 증가
  await supabase.rpc("increment_board_post_count", { board_uuid: board_id }).then(
    () => {},
    async () => {
      // RPC 없을 수 있음 - 폴백: 직접 업데이트
      const { count } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("board_id", board_id)
        .eq("is_deleted", false);
      await supabase.from("boards").update({ post_count: count ?? 0 }).eq("id", board_id);
    }
  );

  return Response.json({ id: data.id });
}
