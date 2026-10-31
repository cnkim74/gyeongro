// 게시된 해외 축제 1건 — 플래너 '축제 맞춤 일정' 자동 입력용
import { getPublishedGlobalFestival } from "@/lib/global-festivals-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await getPublishedGlobalFestival(id);
  if (!f) return Response.json({ error: "축제를 찾을 수 없어요." }, { status: 404 });
  return Response.json(f, { headers: { "Cache-Control": "public, max-age=600" } });
}
