// 셰르파 본인 프로필 수정
//
// PATCH /api/sherpa/profile
//   { tagline?, bio?, hourlyRate?, halfDayRate?, fullDayRate?,
//     specialties?[], languages?[], cities?[], countries?[],
//     pause? (boolean) }

import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { SHERPA_SPECIALTIES, LANGUAGES } from "@/lib/sherpa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_SPECIALTIES = new Set(SHERPA_SPECIALTIES.map((s) => s.id));
const VALID_LANGUAGES = new Set(LANGUAGES.map((l) => l.code));

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  let body: {
    tagline?: string | null;
    bio?: string;
    hourlyRate?: number | null;
    halfDayRate?: number | null;
    fullDayRate?: number | null;
    specialties?: string[];
    languages?: string[];
    cities?: string[];
    countries?: string[];
    pause?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  const { data: sherpa } = await supabase
    .from("sherpas")
    .select("id, status")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!sherpa) {
    return Response.json({ error: "셰르파 프로필이 없어요." }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  if (typeof body.tagline === "string" || body.tagline === null) {
    updates.tagline = body.tagline?.trim() || null;
  }
  if (typeof body.bio === "string") {
    if (body.bio.trim().length < 30) {
      return Response.json(
        { error: "자기소개는 30자 이상이어야 합니다." },
        { status: 400 }
      );
    }
    updates.bio = body.bio.trim();
  }
  if (Array.isArray(body.specialties)) {
    const filtered = body.specialties.filter((s) => VALID_SPECIALTIES.has(s));
    if (filtered.length === 0) {
      return Response.json(
        { error: "최소 한 가지 전문 분야가 필요해요." },
        { status: 400 }
      );
    }
    updates.specialties = filtered;
  }
  if (Array.isArray(body.languages)) {
    const filtered = body.languages.filter((l) => VALID_LANGUAGES.has(l));
    if (filtered.length === 0) {
      return Response.json(
        { error: "최소 한 가지 언어가 필요해요." },
        { status: 400 }
      );
    }
    updates.languages = filtered;
  }
  if (Array.isArray(body.cities) && body.cities.length > 0) {
    updates.cities = body.cities.map((c) => c.trim()).filter(Boolean);
  }
  if (Array.isArray(body.countries) && body.countries.length > 0) {
    updates.countries = body.countries;
  }

  if (body.hourlyRate !== undefined) updates.hourly_rate_krw = body.hourlyRate;
  if (body.halfDayRate !== undefined) updates.half_day_rate_krw = body.halfDayRate;
  if (body.fullDayRate !== undefined) updates.full_day_rate_krw = body.fullDayRate;

  if (typeof body.pause === "boolean") {
    if (body.pause && sherpa.status === "published") {
      updates.status = "paused";
    } else if (!body.pause && sherpa.status === "paused") {
      updates.status = "published";
    }
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ ok: true, message: "변경된 항목이 없어요." });
  }

  const { error } = await supabase
    .from("sherpas")
    .update(updates)
    .eq("id", sherpa.id);

  if (error) {
    return Response.json({ error: "저장 중 오류" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
