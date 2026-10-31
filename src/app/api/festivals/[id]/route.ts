// 플래너 '축제 기반 일정'용 축제 요약
// GET /api/festivals/<contentId> -> { title, startDate, endDate, addr, place, destination }

import { getFestival, destinationOf } from "@/lib/tourapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await getFestival(id);
  if (!f) return Response.json({ error: "축제를 찾을 수 없어요." }, { status: 404 });
  return Response.json(
    {
      contentId: f.contentId,
      title: f.title,
      startDate: f.startDate,
      endDate: f.endDate,
      addr: f.addr,
      place: f.place,
      destination: destinationOf(f.addr),
    },
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
