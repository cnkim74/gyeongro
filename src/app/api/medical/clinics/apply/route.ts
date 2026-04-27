// 의료관광 클리닉 등록 신청
//
// POST { name, nameEn?, direction, country, city, procedures[],
//        specialties?[], description, highlights?[],
//        priceRangeMin?, priceRangeMax?,
//        contactPhone?, contactEmail, websiteUrl? }
//   -> 201 { id, slug }
//
// status='pending', source='user_submitted' 으로 저장. 운영자 검수 대기.

import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_DIRECTIONS = new Set(["inbound", "outbound"]);
const VALID_COUNTRIES = new Set([
  "KR", "JP", "TR", "TH", "HU", "CZ", "MY", "VN", "FR", "IT", "ES", "DE", "US",
  "GB", "CN", "TW",
]);

function makeSlug(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "clinic"}-${suffix}`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  let body: {
    name?: string;
    nameEn?: string | null;
    direction?: string;
    country?: string;
    city?: string;
    procedures?: string[];
    specialties?: string[];
    description?: string;
    highlights?: string[];
    priceRangeMin?: number | null;
    priceRangeMax?: number | null;
    contactPhone?: string | null;
    contactEmail?: string;
    websiteUrl?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const direction = body.direction ?? "";
  const country = body.country ?? "";
  const city = body.city?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  const contactEmail = body.contactEmail?.trim().toLowerCase() ?? "";
  const procedures = Array.isArray(body.procedures) ? body.procedures : [];

  if (name.length < 2 || name.length > 80) {
    return Response.json({ error: "클리닉명은 2~80자여야 합니다." }, { status: 400 });
  }
  if (!VALID_DIRECTIONS.has(direction)) {
    return Response.json({ error: "방향(inbound/outbound)을 선택해주세요." }, { status: 400 });
  }
  if (!VALID_COUNTRIES.has(country)) {
    return Response.json({ error: "지원하지 않는 국가입니다." }, { status: 400 });
  }
  if (city.length < 1) {
    return Response.json({ error: "도시를 입력해주세요." }, { status: 400 });
  }
  if (procedures.length === 0) {
    return Response.json({ error: "최소 한 가지 시술을 선택해주세요." }, { status: 400 });
  }
  if (description.length < 30) {
    return Response.json(
      { error: "클리닉 소개는 30자 이상 입력해주세요." },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(contactEmail)) {
    return Response.json({ error: "올바른 연락 이메일을 입력해주세요." }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  // 시술 유효성
  const { data: validProcs } = await supabase
    .from("medical_procedures")
    .select("slug")
    .in("slug", procedures);
  const validSlugs = new Set((validProcs ?? []).map((p) => p.slug));
  const filteredProcs = procedures.filter((s) => validSlugs.has(s));
  if (filteredProcs.length === 0) {
    return Response.json({ error: "잘못된 시술 항목입니다." }, { status: 400 });
  }

  // 슬러그 생성 + 충돌 회피
  let slug = makeSlug(name);
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase
      .from("medical_clinics")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) break;
    slug = makeSlug(name);
  }

  const { data: inserted, error } = await supabase
    .from("medical_clinics")
    .insert({
      slug,
      name,
      name_en: body.nameEn || null,
      direction,
      country,
      city,
      procedures: filteredProcs,
      specialties: body.specialties ?? null,
      description,
      highlights: body.highlights ?? null,
      price_range_min: body.priceRangeMin ?? null,
      price_range_max: body.priceRangeMax ?? null,
      contact_phone: body.contactPhone || null,
      contact_email: contactEmail,
      website_url: body.websiteUrl || null,
      submitted_by: session.user.id,
      source: "user_submitted",
      status: "pending",
    })
    .select("id, slug")
    .single();

  if (error || !inserted) {
    return Response.json({ error: "신청 중 오류가 발생했습니다." }, { status: 500 });
  }

  return Response.json({ id: inserted.id, slug: inserted.slug }, { status: 201 });
}
