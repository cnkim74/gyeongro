import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getUserRole } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const role = await getUserRole(session.user.id);
  if (role !== "business" && role !== "admin") {
    return Response.json(
      { error: "길잡이(기업회원)만 등록할 수 있어요." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { title, description, category, destination, link_url, image_url } = body;

  if (!title?.trim()) {
    return Response.json({ error: "제목을 입력해주세요." }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("sponsorships")
    .insert({
      user_id: session.user.id,
      title: title.trim(),
      description: description?.trim() || null,
      category: category || null,
      destination: destination || null,
      link_url: link_url || null,
      image_url: image_url || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ id: data.id });
}
