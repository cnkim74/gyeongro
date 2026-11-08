// 스레드 사용자가 데이터 삭제를 요청했을 때 Meta 가 호출 (Delete callback URL)
// Pothos 는 연결 토큰·계정 id 만 보관 → 해당 계정이면 즉시 삭제하고 확인 코드를 돌려줌
import crypto from "node:crypto";
import { disconnectThreads, getThreadsConnection } from "@/lib/threads";
import { parseSignedRequest, signedFromRequest } from "@/lib/threads-signed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://pothostravel.com").replace(/\/$/, "");

export async function POST(req: Request) {
  const data = parseSignedRequest(await signedFromRequest(req));
  if (!data) return Response.json({ error: "invalid signed_request" }, { status: 400 });
  const conn = await getThreadsConnection();
  if (conn && data.user_id && String(conn.userId) === String(data.user_id)) await disconnectThreads();
  const code = crypto.createHash("sha256").update(`${data.user_id ?? ""}:${Date.now()}`).digest("hex").slice(0, 16);
  return Response.json({ url: `${SITE}/privacy`, confirmation_code: code });
}
