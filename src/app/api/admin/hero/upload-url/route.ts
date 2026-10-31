// 히어로 영상·사진 업로드용 서명된 주소 발급 (관리자 전용)
// POST { contentType, size } -> { signedUrl, publicUrl, apikey }

import { requireAdmin } from "@/lib/admin";
import { createHeroUploadUrl } from "@/lib/hero-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  let body: { contentType?: string; size?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }
  try {
    const result = await createHeroUploadUrl(String(body.contentType ?? ""), Number(body.size ?? 0));
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "업로드를 준비하지 못했어요." }, { status: 400 });
  }
}
