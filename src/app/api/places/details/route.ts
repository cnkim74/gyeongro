// 장소 상세 (구글 평점·리뷰 수·영업시간·웹사이트·사진)
// 사용자가 장소의 "정보" 버튼을 눌렀을 때만 호출 — Enterprise 요금 항목이라 미리 불러오지 않음
//
// GET ?id=<Google place ID>  -> PlaceDetails

import { auth } from "@/lib/auth";
import { getPlaceDetails } from "@/lib/places";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id") ?? "";
  // Google place ID 형식만 허용
  if (!/^[A-Za-z0-9_-]{10,300}$/.test(id)) {
    return Response.json({ error: "잘못된 장소 ID" }, { status: 400 });
  }

  const details = await getPlaceDetails(id);
  if (!details) {
    return Response.json({ error: "장소 정보를 불러오지 못했어요." }, { status: 502 });
  }
  // 브라우저에서만 잠깐 재사용 (공유 캐시 금지 — 장소 콘텐츠 캐시 제한)
  return Response.json(details, { headers: { "Cache-Control": "private, max-age=600" } });
}
