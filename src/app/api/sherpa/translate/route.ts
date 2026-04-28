// 셰르파 프로필 다국어 재번역 API
//
// POST /api/sherpa/translate
//   body: { sherpaId?: string }   // 본인 프로필이면 생략 가능
//   응답: 200 { ok: true, updated: { tagline_en, bio_ja, ... } }
//        401 (로그인), 403 (권한 없음), 404 (셰르파 없음), 500 (LLM 실패)
//
// 권한:
//   - sherpaId 미지정: 로그인한 사용자의 셰르파 프로필 (본인)
//   - sherpaId 지정: 운영팀(admin)만 가능
//
// AI 사용량: 한 번 호출 = translation 액션 +3 (en/ja/zh 각 1회 포함)
// 캐시 있으면 LLM 호출 안 일어남 → quota 차감 안 함

import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";
import { translateSherpaProfile } from "@/lib/translate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  let body: { sherpaId?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const supabase = getSupabaseServiceClient();

  // 셰르파 row 조회
  let sherpa: {
    id: string;
    user_id: string;
    tagline: string | null;
    bio: string;
    cities: string[];
  } | null = null;

  if (body.sherpaId) {
    // 운영팀만 다른 셰르파 트리거 가능
    if (!(await isAdmin(session.user.id))) {
      return Response.json({ error: "권한 없음" }, { status: 403 });
    }
    const { data } = await supabase
      .from("sherpas")
      .select("id, user_id, tagline, bio, cities")
      .eq("id", body.sherpaId)
      .maybeSingle();
    sherpa = data ?? null;
  } else {
    const { data } = await supabase
      .from("sherpas")
      .select("id, user_id, tagline, bio, cities")
      .eq("user_id", session.user.id)
      .maybeSingle();
    sherpa = data ?? null;
  }

  if (!sherpa) {
    return Response.json({ error: "셰르파 프로필을 찾을 수 없어요." }, { status: 404 });
  }

  try {
    const translations = await translateSherpaProfile({
      tagline: sherpa.tagline,
      bio: sherpa.bio,
      cities: sherpa.cities,
    });

    const { error } = await supabase
      .from("sherpas")
      .update(translations)
      .eq("id", sherpa.id);
    if (error) throw error;

    return Response.json({ ok: true, updated: translations });
  } catch (e) {
    console.error("[sherpa.translate] failed:", e);
    return Response.json(
      { error: "번역 실패 — 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
