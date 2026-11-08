// 내 AI 플래너 남은 횟수 — GET -> { isAdmin, freeLimit, freeUsed, freeRemaining, credits, creditsExpireAt }
import { auth } from "@/lib/auth";
import { getPlannerQuota } from "@/lib/planner-quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  return Response.json(await getPlannerQuota(session.user.id));
}
