// 축제·박람회 AI 큐레이션 (관리자 전용)
// POST { country, year, month, count?, kind? } -> { inserted, skipped, candidates }
// kind: "festival"(기본) | "expo"(박람회·전시회·아트페어 등 — 관람 대상도 함께 확인)
//
// Claude 가 웹 검색으로 해당 연·월에 열리는 축제를 찾아 '공식·신뢰할 만한 출처로 확인된 날짜'와
// 출처 주소를 붙여 돌려주고, global_festivals 에 status='pending' 으로 저장 → 관리자 검수 후 게시.

import Anthropic from "@anthropic-ai/sdk";
import { requireAdmin } from "@/lib/admin";
import { aiMeter } from "@/lib/ai-runs";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MODEL = "claude-sonnet-5-5";

interface Candidate {
  name: string;
  name_en?: string | null;
  country?: string;
  flag?: string | null;
  city: string;
  destination?: string;
  start_date?: string | null;
  end_date?: string | null;
  period?: string | null;
  summary?: string | null;
  emoji?: string | null;
  source_url?: string | null;
  audience?: string | null;
}

function extractJsonArray(text: string): Candidate[] {
  const t = text.replace(/```json\s*/gi, "").replace(/```/g, "");
  const a = t.indexOf("[");
  const b = t.lastIndexOf("]");
  if (a === -1 || b <= a) return [];
  try {
    const arr = JSON.parse(t.slice(a, b + 1));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

function monthsBetween(start: string | null, end: string | null): number[] {
  if (!start) return [];
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end ?? start}T00:00:00Z`);
  const out = new Set<number>();
  for (let d = new Date(s); d <= e && out.size < 12; d.setUTCMonth(d.getUTCMonth() + 1, 1)) {
    out.add(d.getUTCMonth() + 1);
  }
  out.add(e.getUTCMonth() + 1);
  return [...out];
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });

  let body: { country?: string; year?: number; month?: number; count?: number; kind?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }
  const country = (body.country ?? "").trim().slice(0, 30);
  const year = Number(body.year);
  const month = Number(body.month);
  const count = Math.min(10, Math.max(1, Number(body.count ?? 6)));
  const kind = body.kind === "expo" ? "expo" : "festival";
  if (!country || !(year >= 2025 && year <= 2030) || !(month >= 1 && month <= 12)) {
    return Response.json({ error: "나라·연도·월을 확인해 주세요." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "ANTHROPIC_API_KEY 가 없어요." }, { status: 500 });
  const anthropic = new Anthropic({ apiKey });

  const prompt = `${year}년 ${month}월에 ${country}에서 열리는 여행객이 가볼 만한 축제·문화 행사를 웹 검색으로 찾아 최대 ${count}개 정리해 주세요.

규칙:
- 반드시 ${year}년 개최 날짜를 공식 사이트나 관광청·신뢰할 만한 언론 등에서 확인한 행사만 포함하세요. 날짜를 확인하지 못했으면 넣지 마세요.
- source_url 에는 날짜를 확인한 페이지 주소를 넣으세요.
- 이름·도시·설명은 한국어로, name_en 에는 영어 또는 현지 공식 이름.
- destination 은 한국인 여행자가 일정을 짤 때 쓸 가까운 대표 도시 (한국어).
- summary 는 한두 문장으로 무엇을 볼 수 있는지.
- period 는 "${year}년 ${month}월 3~5일"처럼 짧게.

다른 설명 없이 아래 형식의 JSON 배열만 출력하세요:
[{"name":"","name_en":"","country":"${country}","flag":"국기 이모지","city":"","destination":"","start_date":"YYYY-MM-DD","end_date":"YYYY-MM-DD","period":"","summary":"","emoji":"","source_url":"https://..."}]`;
  const expoPrompt = `${year}년 ${month}월에 ${country}에서 열리는 박람회·전시회·엑스포·아트페어·트레이드쇼 중 한국인 여행자나 출장자가 일정을 맞춰 가볼 만한 행사를 웹 검색으로 찾아 최대 ${count}개 정리해 주세요.

규칙:
- 반드시 ${year}년 개최 날짜를 공식 사이트(주최측·전시장)나 신뢰할 만한 출처에서 확인한 행사만 포함하세요. 확인하지 못했으면 넣지 마세요.
- 국제적으로 알려졌거나 규모가 큰 행사 우선 (관광·여행, 디자인, 미술, 게임, IT·가전, 식품, 자동차, 도서, 패션, 뷰티 등 다양하게).
- source_url 에는 날짜를 확인한 페이지 주소를 넣으세요.
- audience: 일반인도 입장권을 사서 관람할 수 있으면 "public", 업계 관계자(바이어·참가사)만 입장 가능하면 "trade", 일부 날짜만 일반 공개면 "mixed". 확인한 대로 적으세요.
- 이름·도시·설명은 한국어로, name_en 에는 영어 또는 현지 공식 이름.
- city 에는 개최 도시, summary 에는 어떤 전시인지와 전시장 이름을 한두 문장으로.
- destination 은 여행 일정을 짤 때 쓸 가까운 대표 도시 (한국어).
- period 는 "${year}년 ${month}월 3~5일"처럼 짧게.

다른 설명 없이 아래 형식의 JSON 배열만 출력하세요:
[{"name":"","name_en":"","country":"${country}","flag":"국기 이모지","city":"","destination":"","start_date":"YYYY-MM-DD","end_date":"YYYY-MM-DD","period":"","summary":"","emoji":"","audience":"public|trade|mixed","source_url":"https://..."}]`;


  // 웹 검색은 서버에서 여러 번 돌다 pause_turn 으로 멈출 수 있음 → 이어서 요청 (최대 3번)
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: kind === "expo" ? expoPrompt : prompt }];
  let finalText = "";
  const meter = aiMeter(MODEL);
  try {
    for (let i = 0; i < 4; i++) {
      const msg = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 8000,
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }],
        messages,
      });
      meter.add(msg.usage);
      const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
      if (msg.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: msg.content });
        continue;
      }
      finalText = text;
      break;
    }
  } catch (e) {
    await meter.record(kind === "expo" ? "expo_curate" : "festival_curate", session.user.id, false, { country, month });
    return Response.json({ error: `AI 검색 실패: ${e instanceof Error ? e.message : e}` }, { status: 502 });
  }
  await meter.record(kind === "expo" ? "expo_curate" : "festival_curate", session.user.id, !!finalText, { country, month });

  const candidates = extractJsonArray(finalText)
    .filter((c) => c && typeof c.name === "string" && c.name.trim() && typeof c.city === "string" && c.city.trim())
    .filter((c) => isDate(c.start_date) && typeof c.source_url === "string" && /^https?:\/\//.test(c.source_url))
    .slice(0, count);

  if (candidates.length === 0) {
    return Response.json({
      inserted: 0,
      skipped: 0,
      candidates: [],
      note: kind === "expo" ? "날짜가 확인된 박람회를 찾지 못했어요." : "날짜가 확인된 축제를 찾지 못했어요.",
    });
  }

  const supabase = getSupabaseServiceClient();
  let inserted = 0;
  let skipped = 0;
  for (const c of candidates) {
    const start = c.start_date as string;
    const end = isDate(c.end_date) ? c.end_date : start;
    const { data: dup, error: dupErr } = await supabase
      .from("global_festivals")
      .select("id")
      .eq("name", c.name.trim())
      .eq("start_date", start)
      .limit(1);
    if (dupErr) {
      return Response.json(
        { error: "global_festivals 테이블이 없어요. supabase/migration_global_festivals.sql 을 먼저 실행해 주세요." },
        { status: 500 }
      );
    }
    if (dup && dup.length > 0) {
      skipped++;
      continue;
    }
    const { error } = await supabase.from("global_festivals").insert({
      name: c.name.trim().slice(0, 100),
      name_en: c.name_en?.trim().slice(0, 120) || null,
      country: (c.country || country).slice(0, 30),
      flag: c.flag?.slice(0, 8) || null,
      city: c.city.trim().slice(0, 60),
      destination: (c.destination || c.city).trim().slice(0, 60),
      start_date: start,
      end_date: end,
      months: monthsBetween(start, end),
      period: c.period?.slice(0, 60) || null,
      summary: c.summary?.slice(0, 300) || null,
      emoji: c.emoji?.slice(0, 8) || (kind === "expo" ? "🏛️" : "🎉"),
      source_url: c.source_url!.slice(0, 500),
      status: "pending",
      created_by: session.user.id,
      // 박람회는 종류·관람 대상 함께 저장 (축제는 예전 표 구조 그대로도 동작)
      ...(kind === "expo"
        ? {
            kind: "expo",
            audience: c.audience === "public" || c.audience === "trade" || c.audience === "mixed" ? c.audience : null,
          }
        : {}),
    });
    if (error) {
      if (kind === "expo" && /kind|audience/.test(error.message)) {
        return Response.json(
          { error: "박람회용 DB 항목이 없어요. supabase/migration_global_expos.sql 을 먼저 실행해 주세요." },
          { status: 500 }
        );
      }
      return Response.json({ error: `저장 실패: ${error.message}` }, { status: 500 });
    }
    inserted++;
  }

  return Response.json({ inserted, skipped, candidates: candidates.length });
}
