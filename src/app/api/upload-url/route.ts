// 사진 업로드용 서명된 주소 발급 (로그인 사용자) — 스토리 표지·챕터 사진
// POST { contentType, size } -> { signedUrl, publicUrl, apikey }

import { auth } from "@/lib/auth";
import { createUserImageUploadUrl } from "@/lib/media-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  let body: { contentType?: string; size?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }
  try {
    return Response.json(await createUserImageUploadUrl(session.user.id, String(body.contentType ?? ""), Number(body.size ?? 0)));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "업로드를 준비하지 못했어요." }, { status: 400 });
  }
}
