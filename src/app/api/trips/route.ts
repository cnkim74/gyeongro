import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("travel_plans")
    .select("id, title, destination, days, people, budget, created_at, itinerary")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ trips: data });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, destination, days, people, budget, travelStyle, themes, itinerary } = body;

  if (!title || !destination || !itinerary) {
    return Response.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("travel_plans")
    .insert({
      user_id: session.user.id,
      title,
      destination,
      days,
      people,
      budget,
      travel_style: travelStyle ?? null,
      themes: themes ?? [],
      itinerary,
    })
    .select("id")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ id: data.id });
}
