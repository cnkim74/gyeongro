// 해외 축제 검수 (관리자 전용) — PATCH { status } · DELETE
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  const { id } = await params;
  const { status } = (await req.json().catch(() => ({}))) as { status?: string };
  if (!["pending", "published", "rejected"].includes(status ?? "")) {
    return Response.json({ error: "잘못된 상태" }, { status: 400 });
  }
  const { error } = await getSupabaseServiceClient()
    .from("global_festivals")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  revalidatePath("/festivals");
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  const { id } = await params;
  const { error } = await getSupabaseServiceClient().from("global_festivals").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  revalidatePath("/festivals");
  return Response.json({ ok: true });
}
