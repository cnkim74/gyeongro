import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    subtitle,
    destination,
    cover_image_url,
    intro,
    sections,
    tags,
    duration_text,
  } = body;

  if (!title?.trim()) {
    return Response.json({ error: "제목을 입력해주세요." }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("stories")
    .insert({
      user_id: session.user.id,
      title: title.trim(),
      subtitle: subtitle?.trim() || null,
      destination: destination?.trim() || null,
      cover_image_url: cover_image_url || null,
      intro: intro?.trim() || null,
      sections: Array.isArray(sections) ? sections : [],
      tags: Array.isArray(tags) ? tags : [],
      duration_text: duration_text?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ id: data.id });
}
