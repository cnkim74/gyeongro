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
    description,
    destination,
    start_date,
    end_date,
    max_people,
    gender_pref,
    age_range,
    budget_text,
    contact_method,
  } = body;

  if (!title?.trim() || !destination?.trim()) {
    return Response.json(
      { error: "제목과 목적지는 필수입니다." },
      { status: 400 }
    );
  }

  const max = Number(max_people) || 2;
  if (max < 2 || max > 20) {
    return Response.json(
      { error: "인원은 2~20명 사이여야 해요." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("partner_posts")
    .insert({
      user_id: session.user.id,
      title: title.trim(),
      description: description?.trim() || null,
      destination: destination.trim(),
      start_date: start_date || null,
      end_date: end_date || null,
      max_people: max,
      gender_pref: gender_pref || null,
      age_range: age_range || null,
      budget_text: budget_text?.trim() || null,
      contact_method: contact_method?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ id: data.id });
}
