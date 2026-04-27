// 셰르파 신청 API
//
// POST { displayName, tagline?, bio, countries[], cities[], languages[],
//        specialties[], hourlyRate?, halfDayRate?, fullDayRate? }
//   -> 201 { id, slug }   (status='pending' 으로 저장, 운영자 검수 대기)
//   -> 400/401/409

import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { SHERPA_SPECIALTIES, LANGUAGES } from "@/lib/sherpa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_SPECIALTIES = new Set(SHERPA_SPECIALTIES.map((s) => s.id));
const VALID_LANGUAGES = new Set(LANGUAGES.map((l) => l.code));

function makeSlug(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "sherpa"}-${suffix}`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  let body: {
    displayName?: string;
    tagline?: string | null;
    bio?: string;
    countries?: string[];
    cities?: string[];
    languages?: string[];
    specialties?: string[];
    hourlyRate?: number | null;
    halfDayRate?: number | null;
    fullDayRate?: number | null;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const displayName = body.displayName?.trim() ?? "";
  const bio = body.bio?.trim() ?? "";
  const countries = Array.isArray(body.countries) ? body.countries : [];
  const cities = Array.isArray(body.cities) ? body.cities : [];
  const languages = Array.isArray(body.languages) ? body.languages : [];
  const specialties = Array.isArray(body.specialties) ? body.specialties : [];

  if (displayName.length < 2 || displayName.length > 30) {
    return Response.json({ error: "활동명은 2~30자여야 합니다." }, { status: 400 });
  }
  if (bio.length < 30) {
    return Response.json(
      { error: "자기소개는 30자 이상 입력해주세요." },
      { status: 400 }
    );
  }
  if (countries.length === 0 || cities.length === 0) {
    return Response.json(
      { error: "활동 국가와 도시를 입력해주세요." },
      { status: 400 }
    );
  }
  if (languages.length === 0) {
    return Response.json(
      { error: "최소 한 가지 언어를 선택해주세요." },
      { status: 400 }
    );
  }
  if (specialties.length === 0) {
    return Response.json(
      { error: "최소 한 가지 전문 분야를 선택해주세요." },
      { status: 400 }
    );
  }

  const filteredLanguages = languages.filter((l) => VALID_LANGUAGES.has(l));
  const filteredSpecialties = specialties.filter((s) => VALID_SPECIALTIES.has(s));
  if (filteredLanguages.length === 0 || filteredSpecialties.length === 0) {
    return Response.json({ error: "잘못된 옵션이 포함됐습니다." }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  // 이미 신청한 경우
  const { data: existing } = await supabase
    .from("sherpas")
    .select("id, slug, status")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (existing) {
    return Response.json(
      { error: "이미 신청한 이력이 있어요. 기존 프로필을 수정해주세요." },
      { status: 409 }
    );
  }

  // 슬러그 생성 + 충돌 회피
  let slug = makeSlug(displayName);
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase
      .from("sherpas")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) break;
    slug = makeSlug(displayName);
  }

  const { data: inserted, error } = await supabase
    .from("sherpas")
    .insert({
      user_id: session.user.id,
      slug,
      display_name: displayName,
      tagline: body.tagline?.trim() || null,
      bio,
      countries,
      cities,
      languages: filteredLanguages,
      specialties: filteredSpecialties,
      hourly_rate_krw: body.hourlyRate ?? null,
      half_day_rate_krw: body.halfDayRate ?? null,
      full_day_rate_krw: body.fullDayRate ?? null,
      status: "pending",
      agreed_terms_at: new Date().toISOString(),
    })
    .select("id, slug")
    .single();

  if (error || !inserted) {
    return Response.json(
      { error: "신청 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  return Response.json({ id: inserted.id, slug: inserted.slug }, { status: 201 });
}
