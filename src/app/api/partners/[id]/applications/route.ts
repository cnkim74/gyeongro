import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { id: postId } = await params;
  const body = await req.json();
  const message = body.message?.trim() || null;

  const supabase = getSupabaseServiceClient();

  const { data: post } = await supabase
    .from("partner_posts")
    .select("user_id, status")
    .eq("id", postId)
    .single();

  if (!post) {
    return Response.json({ error: "모집글을 찾을 수 없어요." }, { status: 404 });
  }
  if (post.user_id === session.user.id) {
    return Response.json(
      { error: "본인의 모집글에는 신청할 수 없어요." },
      { status: 400 }
    );
  }
  if (post.status !== "open") {
    return Response.json(
      { error: "이 모집은 마감되었어요." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("partner_applications")
    .insert({
      post_id: postId,
      user_id: session.user.id,
      message,
    })
    .select("id")
    .single();

  if (error) {
    if (error.message.includes("unique")) {
      return Response.json({ error: "이미 신청한 모집입니다." }, { status: 400 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ id: data.id });
}
