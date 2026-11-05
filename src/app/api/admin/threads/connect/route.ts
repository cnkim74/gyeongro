// 스레드 계정 연결 시작 (관리자) → Threads 로그인·권한 동의 화면으로 이동
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/admin";
import { threadsAppConfigured, threadsAuthorizeUrl } from "@/lib/threads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  if (!threadsAppConfigured()) {
    return Response.json({ error: "Vercel 환경변수 THREADS_APP_ID / THREADS_APP_SECRET 이 필요해요." }, { status: 400 });
  }
  const state = crypto.randomUUID();
  (await cookies()).set("threads_oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return Response.redirect(threadsAuthorizeUrl(state), 302);
}
