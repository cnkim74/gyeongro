import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sort = url.searchParams.get("sort") ?? "recent";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 50);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const offset = (page - 1) * limit;

  const supabase = getSupabaseServiceClient();
  let query = supabase
    .from("reviews")
    .select("id, title, content, rating, destination, created_at, user_id", {
      count: "exact",
    })
    .eq("is_deleted", false);

  if (sort === "rating") {
    query = query
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: reviews, error, count } = await query.range(
    offset,
    offset + limit - 1
  );
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const userIds = [...new Set((reviews ?? []).map((r) => r.user_id))];
  const usersMap: Record<string, { name: string | null; image: string | null }> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id, name, image, custom_image")
      .in("id", userIds);
    for (const u of users ?? []) {
      usersMap[u.id] = { name: u.name, image: u.custom_image ?? u.image };
    }
  }

  const enriched = (reviews ?? []).map((r) => ({
    ...r,
    author: usersMap[r.user_id] ?? { name: null, image: null },
  }));

  return Response.json({
    reviews: enriched,
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
  const { title, content, rating, destination, trip_id } = body;

  if (!title?.trim() || !content?.trim()) {
    return Response.json(
      { error: "제목과 내용을 입력해주세요." },
      { status: 400 }
    );
  }

  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return Response.json(
      { error: "별점은 1~5 사이여야 해요." },
      { status: 400 }
    );
  }

  if (title.length > 200) {
    return Response.json({ error: "제목은 200자 이하로 입력해주세요." }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      user_id: session.user.id,
      title: title.trim(),
      content: content.trim(),
      rating: ratingNum,
      destination: destination?.trim() || null,
      trip_id: trip_id || null,
    })
    .select("id")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ id: data.id });
}
