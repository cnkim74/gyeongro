// 블로그 자동 작성 설정 (관리자 전용)
// GET -> settings / PUT { ...settings } -> settings

import { requireAdmin } from "@/lib/admin";
import { getAutoSettings, saveAutoSettings } from "@/lib/blog-auto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  return Response.json(await getAutoSettings());
}

export async function PUT(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }
  try {
    // 마지막 실행일은 화면에서 바꾸지 않음 (기존 값 유지)
    const prev = await getAutoSettings();
    return Response.json(await saveAutoSettings({ ...body, lastRunDate: prev.lastRunDate }));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "저장 실패" }, { status: 500 });
  }
}
