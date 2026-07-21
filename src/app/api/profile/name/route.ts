import { auth } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return Response.json({ error: "서버 설정 오류" }, { status: 500 });
  let body: { name?: string };
  try { body = await request.json(); } catch { return Response.json({ error: "잘못된 요청 형식" }, { status: 400 }); }
  const name = body.name?.trim();
  if (!name || name.length < 1 || name.length > 30) return Response.json({ error: "이름은 1~30자여야 합니다." }, { status: 400 });
  const sb = createClient(url, key, { db: { schema: "next_auth" }, auth: { persistSession: false } });
  const { error } = await sb.from("users").update({ name }).eq("id", session.user.id);
  if (error) return Response.json({ error: "저장 중 오류가 발생했습니다." }, { status: 500 });
  revalidatePath("/", "layout");
  return Response.json({ name });
}
