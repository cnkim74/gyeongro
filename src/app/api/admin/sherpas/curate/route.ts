// AI 큐레이션 — 셰르파 후보 자동 생성
//
// POST { country, city, count?, specialties?[] }
//   -> 201 { inserted, slugs }
//
// 셰르파는 실제 사람과 연결되는 데이터라 "프로필 템플릿" 형태로 생성됩니다.
// 운영자가 검수 시 실제 활동 가능한 사람과 매칭하거나, 프로필 자체를 거절합니다.

import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Groq from "groq-sdk";
import { SHERPA_SPECIALTIES, LANGUAGES } from "@/lib/sherpa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COUNTRY_NAMES: Record<string, string> = {
  KR: "대한민국",
  JP: "일본",
  TR: "터키",
  TH: "태국",
  HU: "헝가리",
  FR: "프랑스",
  IT: "이탈리아",
  ES: "스페인",
  US: "미국",
  GB: "영국",
  CN: "중국",
  TW: "대만",
  VN: "베트남",
};

const VALID_SPECIALTIES = new Set(SHERPA_SPECIALTIES.map((s) => s.id));
const VALID_LANGUAGES = new Set(LANGUAGES.map((l) => l.code));

interface CandidateSherpa {
  display_name: string;
  tagline: string;
  tagline_en?: string | null;
  bio: string;
  bio_en?: string | null;
  cities?: string[];
  cities_en?: string[];
  languages: string[];
  specialties: string[];
  hourly_rate_krw?: number | null;
  half_day_rate_krw?: number | null;
  full_day_rate_krw?: number | null;
}

function makeSlug(name: string, country: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${country.toLowerCase()}-${base || "sherpa"}-${suffix}`;
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  }

  let body: {
    country?: string;
    city?: string;
    count?: number;
    specialties?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const country = body.country;
  const city = body.city?.trim();
  const count = Math.min(8, Math.max(1, body.count ?? 4));
  const specialties = (body.specialties ?? []).filter((s) =>
    VALID_SPECIALTIES.has(s)
  );

  if (!country || !COUNTRY_NAMES[country]) {
    return Response.json({ error: "국가를 선택해주세요." }, { status: 400 });
  }
  if (!city) {
    return Response.json({ error: "도시를 입력해주세요." }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI 키가 설정되지 않았어요." }, { status: 500 });
  }

  const groq = new Groq({ apiKey });

  const specialtyHint =
    specialties.length > 0
      ? `다음 분야 중심으로: ${specialties.join(", ")}`
      : "도시 가이드·통역·푸드투어·사진가·쇼핑·의료통역·차량·전통체험 등 다양하게";

  const prompt = `당신은 글로벌 여행 셰르파 매칭 플랫폼의 큐레이터입니다. ${COUNTRY_NAMES[country]} ${city}에서 활동 가능한 가상의 셰르파(현지 가이드) 프로필 ${count}개를 생성해주세요.

목적: 운영팀이 실제 셰르파를 모집할 때 참고할 프로필 템플릿. 한국인 여행자 또는 한국으로 오는 외국인 환자가 매칭 대상.

전문 분야: ${specialtyHint}

각 셰르파마다:
- display_name: 한글 이름 (예: '지원', '하람', '도쿄예지')
- tagline: 한 줄 소개 한글 (20~50자, 강점 명확히)
- tagline_en: 한 줄 소개 영문
- bio: 자기소개 한글 (100~200자, 거주 기간·경력·차별점 포함)
- bio_en: 자기소개 영문
- cities: 한글 도시 배열 (1~3개)
- cities_en: 영문 도시 배열
- languages: ISO 639-1 코드 배열 (ko/en/ja/zh/fr/es/de/th/vi/tr/ru/ar 중)
- specialties: 다음 ID 중 1~4개: city_guide, interpreter, food_tour, photographer, shopping, medical_concierge, transport, tradition
- hourly_rate_krw: 시간당 한화 정수 (보통 25000~70000)
- half_day_rate_krw: 반나절(4시간) 한화 (보통 90000~250000)
- full_day_rate_krw: 종일(8시간) 한화 (보통 160000~400000)

JSON 출력 (이 구조 정확히):
{
  "sherpas": [
    { "display_name": "...", "tagline": "...", "tagline_en": "...", "bio": "...", "bio_en": "...", "cities": [...], "cities_en": [...], "languages": [...], "specialties": [...], "hourly_rate_krw": 0, "half_day_rate_krw": 0, "full_day_rate_krw": 0 }
  ]
}`;

  let candidates: CandidateSherpa[] = [];
  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content:
            "당신은 셰르파 큐레이터. JSON object만 반환. 모든 한글은 정확한 한국어, 영문은 정확한 영어. 자연스럽고 차별화된 프로필 작성. 마크다운/설명 절대 금지.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.sherpas)) {
      candidates = parsed.sherpas as CandidateSherpa[];
    }
  } catch (err) {
    return Response.json(
      { error: "AI 생성 실패", detail: err instanceof Error ? err.message : "unknown" },
      { status: 502 }
    );
  }

  if (candidates.length === 0) {
    return Response.json({ error: "AI가 후보를 생성하지 못했어요." }, { status: 502 });
  }

  const supabase = getSupabaseServiceClient();
  const inserts: Array<Record<string, unknown>> = [];

  for (const c of candidates) {
    if (!c.display_name || !c.bio) continue;
    const filteredLangs = (c.languages ?? []).filter((l) => VALID_LANGUAGES.has(l));
    const filteredSpecs = (c.specialties ?? []).filter((s) =>
      VALID_SPECIALTIES.has(s)
    );
    if (filteredLangs.length === 0 || filteredSpecs.length === 0) continue;

    let slug = makeSlug(c.display_name, country);
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase
        .from("sherpas")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!data) break;
      slug = makeSlug(c.display_name, country);
    }

    inserts.push({
      slug,
      display_name: c.display_name.trim(),
      tagline: c.tagline?.trim() || null,
      tagline_en: c.tagline_en?.trim() || null,
      bio: c.bio.trim(),
      bio_en: c.bio_en?.trim() || null,
      countries: [country],
      cities: Array.isArray(c.cities) && c.cities.length > 0 ? c.cities : [city],
      cities_en: Array.isArray(c.cities_en) ? c.cities_en : null,
      languages: filteredLangs,
      specialties: filteredSpecs,
      hourly_rate_krw: c.hourly_rate_krw ?? null,
      half_day_rate_krw: c.half_day_rate_krw ?? null,
      full_day_rate_krw: c.full_day_rate_krw ?? null,
      status: "pending",
      // user_id NULL — 실제 사람과 미연결 (운영자가 모집 시 매칭)
    });
  }

  if (inserts.length === 0) {
    return Response.json(
      { error: "유효한 후보를 생성하지 못했어요." },
      { status: 502 }
    );
  }

  const { error } = await supabase.from("sherpas").insert(inserts);
  if (error) {
    return Response.json(
      { error: "저장 중 오류", detail: error.message },
      { status: 500 }
    );
  }

  return Response.json(
    {
      inserted: inserts.length,
      slugs: inserts.map((i) => i.slug as string),
    },
    { status: 201 }
  );
}
