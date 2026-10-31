// 장소명 → 좌표 (예전에 저장된 일정처럼 좌표가 없거나 30일이 지난 경우 화면에서 호출)
//
// POST { items: [{ place, city? }] }  (최대 60개)
//   -> { geo: (PlaceGeo | null)[] }

import { auth } from "@/lib/auth";
import { resolvePlaces, type PlaceQuery } from "@/lib/places";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // 구글 사용량 보호 — 로그인 사용자만
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  let body: { items?: PlaceQuery[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const items = (body.items ?? [])
    .filter((i) => i && typeof i.place === "string" && i.place.trim())
    .slice(0, 60)
    .map((i) => ({
      place: i.place.slice(0, 120),
      city: typeof i.city === "string" ? i.city.slice(0, 60) : undefined,
    }));

  const geo = await resolvePlaces(items);
  return Response.json({ geo });
}
