// 샘플 콘텐츠 채우기 (관리자 전용)
// POST -> { boardCreated, posts, stories, skipped }
//
// - '여행 유튜브' 게시판이 없으면 생성
// - 게시판 글·스토리를 관리자 계정으로 등록 (제목에 [Pothos 에디터]·[공지] 표기)
// - 같은 제목이 이미 있으면 건너뜀 → 여러 번 눌러도 중복 없음

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { SEED_POSTS, SEED_STORIES, YOUTUBE_BOARD } from "@/lib/seed-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  const userId = session.user.id;
  const supabase = getSupabaseServiceClient();

  // 1) 여행 유튜브 게시판
  let boardCreated = false;
  const { data: ytBoard } = await supabase.from("boards").select("id").eq("slug", YOUTUBE_BOARD.slug).maybeSingle();
  if (!ytBoard) {
    const { error } = await supabase.from("boards").insert({ ...YOUTUBE_BOARD, is_published: true, is_admin_only: false });
    if (error) return Response.json({ error: `게시판 생성 실패: ${error.message}` }, { status: 500 });
    boardCreated = true;
  }

  const { data: boards, error: bErr } = await supabase.from("boards").select("id, slug");
  if (bErr) return Response.json({ error: bErr.message }, { status: 500 });
  const boardId = Object.fromEntries((boards ?? []).map((b) => [b.slug as string, b.id as string]));

  // 2) 게시판 글
  let posts = 0;
  let skipped = 0;
  const missingBoards = new Set<string>();
  for (const p of SEED_POSTS) {
    const bid = boardId[p.board];
    if (!bid) {
      missingBoards.add(p.board);
      continue;
    }
    const { data: exists } = await supabase.from("posts").select("id").eq("board_id", bid).eq("title", p.title).limit(1);
    if (exists && exists.length > 0) {
      skipped++;
      continue;
    }
    const { error } = await supabase.from("posts").insert({
      user_id: userId,
      board_id: bid,
      category: p.board === "notice" || p.board === "youtube" ? "free" : p.board,
      title: p.title,
      content: p.content,
      is_pinned: !!p.pinned,
    });
    if (error) return Response.json({ error: `글 등록 실패: ${error.message}` }, { status: 500 });
    posts++;
  }

  // 게시판별 글 수 다시 계산
  for (const [, bid] of Object.entries(boardId)) {
    const { count } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("board_id", bid)
      .eq("is_deleted", false);
    await supabase.from("boards").update({ post_count: count ?? 0 }).eq("id", bid);
  }

  // 3) 스토리
  let stories = 0;
  for (const s of SEED_STORIES) {
    const { data: exists } = await supabase.from("stories").select("id").eq("title", s.title).limit(1);
    if (exists && exists.length > 0) {
      skipped++;
      continue;
    }
    const { error } = await supabase.from("stories").insert({ user_id: userId, ...s });
    if (error) return Response.json({ error: `스토리 등록 실패: ${error.message}` }, { status: 500 });
    stories++;
  }

  revalidatePath("/board", "layout");
  revalidatePath("/stories", "layout");
  revalidatePath("/travel-guide");

  return Response.json({ boardCreated, posts, stories, skipped, missingBoards: [...missingBoards] });
}
