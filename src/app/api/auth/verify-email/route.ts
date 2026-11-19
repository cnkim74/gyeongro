// 이메일 인증 (로그인한 회원)
// GET  -> { required, verified }
// POST { action: "send" } -> { ok, email } / { action: "confirm", code } -> { ok }
import { auth } from "@/lib/auth";
import { confirmVerifyCode, emailVerifyRequired, isEmailVerified, sendVerifyCode } from "@/lib/email-verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  return Response.json({ required: emailVerifyRequired(), verified: await isEmailVerified(session.user.id) });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { action?: string; code?: string };
  if (body.action === "send") {
    const r = await sendVerifyCode(session.user.id);
    return r.ok ? Response.json(r) : Response.json({ error: r.error }, { status: 400 });
  }
  if (body.action === "confirm") {
    const r = await confirmVerifyCode(session.user.id, String(body.code ?? ""));
    return r.ok ? Response.json(r) : Response.json({ error: r.error }, { status: 400 });
  }
  return Response.json({ error: "알 수 없는 요청" }, { status: 400 });
}
