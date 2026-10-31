// 메인 히어로 설정 저장 (관리자 전용)
// POST HeroConfig -> { config }

import { requireAdmin } from "@/lib/admin";
import { saveHeroConfig } from "@/lib/hero-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }
  try {
    const config = await saveHeroConfig(body);
    return Response.json({ config });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "저장하지 못했어요." }, { status: 500 });
  }
}
