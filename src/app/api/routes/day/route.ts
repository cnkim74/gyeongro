// 하루 동선의 도로 기준 경로 — 지도에서 Day 경로를 그릴 때 호출
//
// POST { points: [{ lat, lng, placeId? }] }  (방문 순서, 2~20개)
//   -> DayRoute | { route: null }

import { auth } from "@/lib/auth";
import { getDayRoute, type RoutePoint } from "@/lib/routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // 길찾기 사용량 보호 — 로그인 사용자만
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  let body: { points?: RoutePoint[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const points = (body.points ?? [])
    .filter(
      (p) =>
        p &&
        typeof p.lat === "number" &&
        typeof p.lng === "number" &&
        Math.abs(p.lat) <= 90 &&
        Math.abs(p.lng) <= 180
    )
    .slice(0, 20)
    .map((p) => ({
      lat: p.lat,
      lng: p.lng,
      placeId: typeof p.placeId === "string" && /^[A-Za-z0-9_-]{10,300}$/.test(p.placeId) ? p.placeId : undefined,
    }));

  const route = await getDayRoute(points);
  return Response.json(
    { route },
    // 같은 사용자가 지도를 다시 열 때만 잠깐 재사용 (공유 캐시 금지)
    { headers: { "Cache-Control": "private, max-age=600" } }
  );
}
