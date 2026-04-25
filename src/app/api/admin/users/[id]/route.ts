import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "권한 없음" }, { status: 403 });

  const { id } = await params;
  if (id === session.user.id) {
    return Response.json(
      { error: "본인의 권한은 변경할 수 없어요." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { isAdmin } = body;

  const supabase = getSupabaseServiceClient();

  if (isAdmin) {
    const { error } = await supabase.from("admins").upsert({ user_id: id });
    if (error) return Response.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from("admins").delete().eq("user_id", id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
