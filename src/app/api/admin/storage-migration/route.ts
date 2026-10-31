// Supabase Storage → R2 이전 (관리자 전용)
// GET  → 아직 Supabase에 남은 대상 점검
// POST → 한 번에 시간 예산만큼 옮기고 남은 수를 돌려줌 (0 이 될 때까지 반복 호출)

import { requireAdmin } from "@/lib/admin";
import { getMigrationStatus, runMigrationStep } from "@/lib/storage-migration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  if (!(await requireAdmin())) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  try {
    return Response.json(await getMigrationStatus());
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "점검 실패" }, { status: 500 });
  }
}

export async function POST() {
  if (!(await requireAdmin())) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  try {
    return Response.json(await runMigrationStep());
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "이전 실패" }, { status: 500 });
  }
}
