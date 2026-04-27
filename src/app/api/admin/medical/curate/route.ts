// AI 큐레이션 — 의료관광 클리닉 후보 자동 생성
//
// POST { procedureSlug, country, direction, count? (default 5) }
//   -> 201 { inserted: number, slugs: string[] }
//
// 동작:
//   1. Groq에게 N개 클리닉 후보 JSON 요청
//   2. 각 후보를 medical_clinics에 status='pending', source='ai_curated' 로 저장
//   3. 관리자가 검수 페이지에서 게시/거절
//
// 안전장치:
//   - AI 생성 데이터는 환각(hallucination) 가능 → 운영자 검증 필수
//   - ai_notes에 "AI 큐레이션, 검증 필요" 자동 기록
//   - count는 1~10으로 제한

import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Groq from "groq-sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COUNTRY_NAMES: Record<string, string> = {
  KR: "대한민국",
  JP: "일본",
  TR: "터키",
  TH: "태국",
  HU: "헝가리",
  CZ: "체코",
  MY: "말레이시아",
  VN: "베트남",
  FR: "프랑스",
  IT: "이탈리아",
  ES: "스페인",
  US: "미국",
  GB: "영국",
  CN: "중국",
  TW: "대만",
};

interface CandidateClinic {
  name: string;
  name_en?: string | null;
  city: string;
  city_en?: string | null;
  specialties?: string[];
  description: string;
  description_en?: string | null;
  highlights?: string[];
  highlights_en?: string[];
  price_range_min?: number | null;
  price_range_max?: number | null;
  website_url?: string | null;
}

function makeSlug(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "clinic"}-${suffix}`;
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  }

  let body: {
    procedureSlug?: string;
    country?: string;
    direction?: string;
    count?: number;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const procedureSlug = body.procedureSlug;
  const country = body.country;
  const direction = body.direction;
  const count = Math.min(10, Math.max(1, body.count ?? 5));

  if (!procedureSlug || !country) {
    return Response.json(
      { error: "시술과 국가를 선택해주세요." },
      { status: 400 }
    );
  }
  if (direction !== "inbound" && direction !== "outbound") {
    return Response.json({ error: "방향이 잘못됐습니다." }, { status: 400 });
  }
  if (!COUNTRY_NAMES[country]) {
    return Response.json({ error: "지원하지 않는 국가입니다." }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const { data: procedure } = await supabase
    .from("medical_procedures")
    .select("slug, name_ko, name_en")
    .eq("slug", procedureSlug)
    .maybeSingle();
  if (!procedure) {
    return Response.json({ error: "잘못된 시술입니다." }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI 키가 설정되지 않았어요." }, { status: 500 });
  }

  const groq = new Groq({ apiKey });

  const directionDesc =
    direction === "inbound"
      ? "외국인 환자가 한국으로 의료관광 오는 케이스"
      : "한국인 환자가 해외로 의료관광 가는 케이스";

  const prompt = `당신은 의료관광 분야 전문 큐레이터입니다. ${COUNTRY_NAMES[country]}에서 ${procedure.name_ko}(${procedure.name_en ?? procedureSlug}) 분야로 외국인 환자에게 잘 알려진 클리닉/병원 후보를 ${count}개 추천해주세요.

상황: ${directionDesc}

각 클리닉마다 다음 정보를 포함:
- name: 한글 이름 (또는 한글 음차)
- name_en: 영문명
- city: 한글 도시명 (예: '서울 강남구', '이스탄불')
- city_en: 영문 도시명
- specialties: 세부 시술 배열 (3~5개)
- description: 한글 설명 (2~3문장, 60~150자)
- description_en: 영문 설명 (60~150 chars)
- highlights: 강점 한글 배열 (3~5개, 각 10~25자)
- highlights_en: 강점 영문 배열
- price_range_min: 한화 KRW 정수 (예: 1500000)
- price_range_max: 한화 KRW 정수
- website_url: null (확실하지 않으면 null)

규칙:
- 실제 존재하는 클리닉 위주로 추천 (학습된 일반 지식 기반)
- 정확하지 않은 가짜 이름 금지. 일반적인 명칭(예: '강남 OO 성형외과')은 OK
- 가격은 해당 시술의 시장 평균 범위
- 한국 외 국가에서도 도시 영문명은 정확히

JSON 출력 형식 (이 구조 정확히 준수):
{
  "clinics": [
    { "name": "...", "name_en": "...", "city": "...", "city_en": "...", "specialties": [...], "description": "...", "description_en": "...", "highlights": [...], "highlights_en": [...], "price_range_min": 0, "price_range_max": 0, "website_url": null }
  ]
}`;

  let candidates: CandidateClinic[] = [];
  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content:
            "당신은 의료관광 클리닉 큐레이터. JSON object만 반환하세요. 모든 한글은 정확한 한국어, 영문은 정확한 영어로. 환각 금지: 모르면 일반적 명칭이나 null 사용. 마크다운/설명 절대 금지.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.clinics)) {
      candidates = parsed.clinics as CandidateClinic[];
    }
  } catch (err) {
    return Response.json(
      {
        error: "AI 생성 실패",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 502 }
    );
  }

  if (candidates.length === 0) {
    return Response.json({ error: "AI가 후보를 생성하지 못했어요." }, { status: 502 });
  }

  // 슬러그 중복 회피해서 일괄 insert
  const inserts: Array<{
    slug: string;
    name: string;
    name_en: string | null;
    direction: string;
    country: string;
    city: string;
    city_en: string | null;
    procedures: string[];
    specialties: string[] | null;
    description: string;
    description_en: string | null;
    highlights: string[] | null;
    highlights_en: string[] | null;
    price_range_min: number | null;
    price_range_max: number | null;
    website_url: string | null;
    source: string;
    status: string;
    submitted_by: string;
    ai_notes: string;
  }> = [];

  for (const c of candidates) {
    if (!c.name || !c.city || !c.description) continue;
    let slug = makeSlug(c.name);
    // 슬러그 충돌 회피
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase
        .from("medical_clinics")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!data) break;
      slug = makeSlug(c.name);
    }
    inserts.push({
      slug,
      name: c.name.trim(),
      name_en: c.name_en?.trim() || null,
      direction,
      country,
      city: c.city.trim(),
      city_en: c.city_en?.trim() || null,
      procedures: [procedureSlug],
      specialties: Array.isArray(c.specialties) ? c.specialties : null,
      description: c.description.trim(),
      description_en: c.description_en?.trim() || null,
      highlights: Array.isArray(c.highlights) ? c.highlights : null,
      highlights_en: Array.isArray(c.highlights_en) ? c.highlights_en : null,
      price_range_min: c.price_range_min ?? null,
      price_range_max: c.price_range_max ?? null,
      website_url: c.website_url ?? null,
      source: "ai_curated",
      status: "pending",
      submitted_by: session.user.id,
      ai_notes: `AI 큐레이션 자동 생성 (${COUNTRY_NAMES[country]} · ${procedure.name_ko}). 검증 필요 — 실제 클리닉명·주소·연락처는 운영자가 확인 후 게시.`,
    });
  }

  if (inserts.length === 0) {
    return Response.json(
      { error: "유효한 후보를 생성하지 못했어요." },
      { status: 502 }
    );
  }

  const { error } = await supabase.from("medical_clinics").insert(inserts);
  if (error) {
    return Response.json(
      { error: "저장 중 오류가 발생했어요.", detail: error.message },
      { status: 500 }
    );
  }

  return Response.json(
    {
      inserted: inserts.length,
      slugs: inserts.map((i) => i.slug),
    },
    { status: 201 }
  );
}
