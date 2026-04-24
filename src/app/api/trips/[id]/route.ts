import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("travel_plans")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json({ trip: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("travel_plans")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
