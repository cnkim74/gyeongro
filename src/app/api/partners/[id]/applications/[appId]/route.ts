import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { id: postId, appId } = await params;
  const body = await req.json();
  const status = body.status;

  if (!["accepted", "rejected"].includes(status)) {
    return Response.json({ error: "유효하지 않은 상태" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const { data: post } = await supabase
    .from("partner_posts")
    .select("user_id, max_people, current_people")
    .eq("id", postId)
    .single();

  if (!post || post.user_id !== session.user.id) {
    return Response.json({ error: "권한이 없어요." }, { status: 403 });
  }

  const { error } = await supabase
    .from("partner_applications")
    .update({ status })
    .eq("id", appId)
    .eq("post_id", postId);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // 수락 시 current_people 증가, 마감 처리
  if (status === "accepted") {
    const newCount = (post.current_people ?? 1) + 1;
    const update: Record<string, unknown> = { current_people: newCount };
    if (newCount >= post.max_people) update.status = "closed";
    await supabase.from("partner_posts").update(update).eq("id", postId);
  }

  return Response.json({ ok: true });
}
