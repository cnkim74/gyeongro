// 스레드 연결 완료 (Threads 가 돌려보냄) → 장기 토큰 저장 → 블로그 관리로
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/admin";
import { completeThreadsAuth } from "@/lib/threads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = (q: string) => Response.redirect(new URL(`/admin/blog?threads=${q}`, url.origin), 302);
  const session = await requireAdmin();
  if (!session) return back("not-admin");

  const jar = await cookies();
  const expected = jar.get("threads_oauth_state")?.value;
  jar.delete("threads_oauth_state");
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (url.searchParams.get("error")) return back("denied");
  if (!code || !state || state !== expected) return back("invalid");

  try {
    // Threads 가 붙이는 '#_' 꼬리 제거
    await completeThreadsAuth(code.replace(/#_$/, ""));
    return back("connected");
  } catch (e) {
    console.log(`[threads] connect failed: ${e instanceof Error ? e.message : e}`);
    return back("failed");
  }
}
