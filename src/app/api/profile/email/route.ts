import { auth } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return Response.json({ error: "서버 설정 오류" }, { status: 500 });
  let body: { email?: string };
  try { body = await request.json(); } catch { return Response.json({ error: "잘못된 요청 형식" }, { status: 400 }); }
  const email = body.email?.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return Response.json({ error: "올바른 이메일 형식이 아닙니다." }, { status: 400 });
  const sb = createClient(url, key, { db: { schema: "next_auth" }, auth: { persistSession: false } });
  const { data: existing } = await sb.from("users").select("id").ilike("email", email).neq("id", session.user.id).maybeSingle();
  if (existing) return Response.json({ error: "이미 사용 중인 이메일입니다." }, { status: 409 });
  const { error } = await sb.from("users").update({ email }).eq("id", session.user.id);
  if (error) return Response.json({ error: "저장 중 오류가 발생했습니다." }, { status: 500 });
  revalidatePath("/", "layout");
  return Response.json({ email });
}
