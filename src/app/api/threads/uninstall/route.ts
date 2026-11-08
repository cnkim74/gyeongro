// 스레드에서 사용자가 Pothos 앱 연결을 해제했을 때 Meta 가 호출 (Uninstall callback URL)
// 연결된 계정이면 저장된 토큰을 지움
import { disconnectThreads, getThreadsConnection } from "@/lib/threads";
import { parseSignedRequest, signedFromRequest } from "@/lib/threads-signed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const data = parseSignedRequest(await signedFromRequest(req));
  if (!data) return Response.json({ error: "invalid signed_request" }, { status: 400 });
  const conn = await getThreadsConnection();
  if (conn && data.user_id && String(conn.userId) === String(data.user_id)) await disconnectThreads();
  return Response.json({ ok: true });
}
