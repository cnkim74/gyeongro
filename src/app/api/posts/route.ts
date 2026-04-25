import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CATEGORIES = ["free", "tip", "question", "review"];

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  const supabase = getSupabaseServiceClient();
  let query = supabase
    .from("posts")
    .select(
      "id, title, category, view_count, is_pinned, created_at, user_id",
      { count: "exact" }
    )
    .eq("is_deleted", false)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category && VALID_CATEGORIES.includes(category)) {
    query = query.eq("category", category);
  }

  const { data: posts, error, count } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // 작성자 정보 일괄 조회
  const userIds = [...new Set((posts ?? []).map((p) => p.user_id))];
  const usersMap: Record<string, { name: string | null; image: string | null }> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id, name, image, custom_image")
      .in("id", userIds);
    for (const u of users ?? []) {
      usersMap[u.id] = {
        name: u.name,
        image: u.custom_image ?? u.image,
      };
    }
  }

  // 댓글 수 일괄 조회
  const postIds = (posts ?? []).map((p) => p.id);
  const commentCounts: Record<string, number> = {};
  if (postIds.length > 0) {
    const { data: comments } = await supabase
      .from("comments")
      .select("post_id")
      .in("post_id", postIds)
      .eq("is_deleted", false);
    for (const c of comments ?? []) {
      commentCounts[c.post_id] = (commentCounts[c.post_id] ?? 0) + 1;
    }
  }

  const enriched = (posts ?? []).map((p) => ({
    ...p,
    author: usersMap[p.user_id] ?? { name: null, image: null },
    comment_count: commentCounts[p.id] ?? 0,
  }));

  return Response.json({
    posts: enriched,
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const body = await req.json();
  const { title, content, category } = body;

  if (!title?.trim() || !content?.trim()) {
    return Response.json(
      { error: "제목과 내용을 입력해주세요." },
      { status: 400 }
    );
  }
  if (title.length > 200) {
    return Response.json({ error: "제목은 200자 이하로 입력해주세요." }, { status: 400 });
  }

  const cat = VALID_CATEGORIES.includes(category) ? category : "free";

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: session.user.id,
      title: title.trim(),
      content: content.trim(),
      category: cat,
    })
    .select("id")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ id: data.id });
}
