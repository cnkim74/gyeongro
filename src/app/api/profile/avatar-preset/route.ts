// 아바타 프리셋 변경 API
//
// POST { presetId: string | null }
//   -> 200 { avatarPreset, url }
//   -> 400 (잘못된 프리셋), 401, 500

import { auth } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { AVATAR_BY_ID } from "@/lib/avatars";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return Response.json({ error: "서버 설정 오류" }, { status: 500 });
  }

  let body: { presetId?: string | null };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const presetId = body.presetId?.trim() || null;
  if (presetId !== null && !AVATAR_BY_ID[presetId]) {
    return Response.json({ error: "잘못된 아바타입니다." }, { status: 400 });
  }

  const sb = createClient(url, key, {
    db: { schema: "next_auth" },
    auth: { persistSession: false },
  });

  const { error } = await sb
    .from("users")
    .update({ avatar_preset: presetId })
    .eq("id", session.user.id);

  if (error) {
    return Response.json({ error: "저장 중 오류가 발생했습니다." }, { status: 500 });
  }

  return Response.json({
    avatarPreset: presetId,
    url: presetId ? AVATAR_BY_ID[presetId].url : null,
  });
}
