// 나라별 여행경보 조회 — GET ?country=일본  (또는 ISO 코드 JP)
// -> { alarms: TravelAlarm[] } | { alarms: null } (데이터 미승인·오류)

import { getTravelAlarm } from "@/lib/travel-alarm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const country = new URL(req.url).searchParams.get("country") ?? "";
  if (!country.trim()) return Response.json({ error: "나라 이름을 입력해 주세요." }, { status: 400 });
  const alarms = await getTravelAlarm(country);
  return Response.json({ alarms }, { headers: { "Cache-Control": "public, max-age=1800" } });
}
