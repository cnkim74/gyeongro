// 블로그 핵심 키워드 AI 추천 (관리자) — 가벼운 모델(Haiku)로 저렴하게
// POST { title, excerpt, content } -> { focus, related[], title, excerpt }
import Anthropic from "@anthropic-ai/sdk";
import { requireAdmin } from "@/lib/admin";
import { recordAiRun } from "@/lib/ai-runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = "claude-haiku-5-5";

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "ANTHROPIC_API_KEY 가 없어요." }, { status: 500 });
  const body = (await req.json().catch(() => ({}))) as { title?: string; excerpt?: string; content?: string };
  const title = String(body.title ?? "").slice(0, 200);
  const excerpt = String(body.excerpt ?? "").slice(0, 400);
  const content = String(body.content ?? "").slice(0, 4000);
  if (!title && !content) return Response.json({ error: "제목이나 본문을 먼저 써 주세요." }, { status: 400 });

  const prompt = `여행 블로그 글의 검색 노출(네이버·구글)을 위한 키워드를 정해 주세요.

[글 제목] ${title}
[요약] ${excerpt}
[본문 앞부분]
${content}

규칙:
- focus: 사람들이 검색창에 실제로 치는 말 그대로의 핵심 키워드 1개 (2~4단어, 예: "블라디보스토크 겨울 여행"). 너무 넓은 말("일본 여행")은 피하기.
- related: 함께 노릴 보조 키워드 5~7개. 핵심 키워드와 같은 말은 빼고, 이 글이 실제로 다루는(또는 자연스럽게 다룰 수 있는) 내용만.
  사람들이 실제로 검색하는 짧은 말 (2~4단어, 예: "블라디보스토크 12월 날씨", "블라디보스토크 여행 경비", "블라디보스토크 2박3일").
  비용·날씨·일정·준비물·교통·추천처럼 서로 다른 궁금증을 고루 담고, 비슷한 말을 반복하지 말 것.
- title: 핵심 키워드로 시작하는 40자 이내 새 제목 제안 (클릭하고 싶게, 과장 없이).
- excerpt: 핵심 키워드가 첫 문장에 들어간 요약 120자 이내.

JSON 한 개만 출력: {"focus":"","related":["",""],"title":"","excerpt":""}`;

  const anthropic = new Anthropic({ apiKey });
  let ok = false;
  let usage = { input: 0, output: 0 };
  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: prompt }],
    });
    usage = { input: msg.usage.input_tokens, output: msg.usage.output_tokens };
    const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const a = text.indexOf("{");
    const b = text.lastIndexOf("}");
    const j = JSON.parse(text.slice(a, b + 1)) as { focus?: string; related?: string[]; title?: string; excerpt?: string };
    ok = true;
    return Response.json({
      focus: String(j.focus ?? "").trim().slice(0, 60),
      related: (Array.isArray(j.related) ? j.related : []).map((x) => String(x).trim()).filter(Boolean).filter((x) => x.replace(/\s/g, "") !== String(j.focus ?? "").replace(/\s/g, "")).slice(0, 8),
      title: String(j.title ?? "").trim().slice(0, 80),
      excerpt: String(j.excerpt ?? "").trim().slice(0, 200),
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? `추천 실패: ${e.message}` : "추천 실패" }, { status: 502 });
  } finally {
    await recordAiRun({
      userId: session.user.id,
      action: "blog_keyword",
      calls: 1,
      input: usage.input,
      output: usage.output,
      usd: (usage.input * 0.1 + usage.output * 0.5) / 1_000_000,
      ok,
    });
  }
}
