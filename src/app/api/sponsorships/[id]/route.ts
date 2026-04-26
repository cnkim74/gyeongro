import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServiceClient();
  const { data: row } = await supabase
    .from("sponsorships")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!row) return Response.json({ error: "찾을 수 없어요." }, { status: 404 });

  const admin = await isAdmin(session.user.id);
  if (row.user_id !== session.user.id && !admin) {
    return Response.json({ error: "권한이 없어요." }, { status: 403 });
  }

  const { error } = await supabase.from("sponsorships").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
