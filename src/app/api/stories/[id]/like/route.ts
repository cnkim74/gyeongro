import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from("story_likes")
    .insert({ story_id: id, user_id: session.user.id });

  if (error) {
    if (error.message.includes("unique")) {
      // 이미 좋아요 → 취소
      await supabase
        .from("story_likes")
        .delete()
        .eq("story_id", id)
        .eq("user_id", session.user.id);
      const { count } = await supabase
        .from("story_likes")
        .select("id", { count: "exact", head: true })
        .eq("story_id", id);
      await supabase.from("stories").update({ like_count: count ?? 0 }).eq("id", id);
      return Response.json({ liked: false, count: count ?? 0 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  const { count } = await supabase
    .from("story_likes")
    .select("id", { count: "exact", head: true })
    .eq("story_id", id);
  await supabase.from("stories").update({ like_count: count ?? 0 }).eq("id", id);

  return Response.json({ liked: true, count: count ?? 0 });
}
