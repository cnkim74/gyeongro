// 핵심 키워드를 본문에 자연스럽게 반영 (관리자) — 첫 문단과 ## 소제목 1~2개만 고침
// POST { keyword, content } -> { content, changes: [{ before, after }] }
// 본문 나머지는 그대로 두고, AI가 준 문장으로 해당 줄만 바꿔 끼움 (전체를 새로 쓰지 않음)
import Anthropic from "@anthropic-ai/sdk";
import { requireAdmin } from "@/lib/admin";
import { recordAiRun } from "@/lib/ai-runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = "claude-sonnet-5-5";

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "ANTHROPIC_API_KEY 가 없어요." }, { status: 500 });
  const body = (await req.json().catch(() => ({}))) as { keyword?: string; content?: string };
  const keyword = String(body.keyword ?? "").trim().slice(0, 60);
  const content = String(body.content ?? "");
  if (!keyword || !content.trim()) return Response.json({ error: "핵심 키워드와 본문이 필요해요." }, { status: 400 });

  // 첫 문단(제목·사진 줄이 아닌 첫 글 덩어리)과 ## 소제목 줄 찾기
  const lines = content.split("\n");
  let pStart = -1;
  let pEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (pStart === -1) {
      if (t && !t.startsWith("#") && !t.startsWith("![") && !t.startsWith(">") && !t.startsWith("```")) pStart = i;
    } else if (!t) {
      pEnd = i;
      break;
    }
  }
  if (pStart !== -1 && pEnd === -1) pEnd = lines.length;
  const firstPara = pStart === -1 ? "" : lines.slice(pStart, pEnd).join("\n");
  // 참고 자료·마무리 소제목은 건드리지 않음
  const headings = lines
    .map((l, i) => ({ i, l }))
    .filter(({ l }) => /^##\s/.test(l) && !/참고 자료|마무리|자주 묻는/.test(l));

  const prompt = `여행 블로그 글의 검색 노출을 위해 핵심 키워드 "${keyword}"를 자연스럽게 반영하려고 해요.

[첫 문단]
${firstPara}

[소제목 목록]
${headings.map((h, n) => `${n}: ${h.l}`).join("\n")}

해 줄 일:
1. 첫 문단을 고쳐서 첫 문장에 "${keyword}"가 자연스럽게 들어가게. 내용·말투·길이는 최대한 유지 (사실을 새로 추가하지 말 것).
2. 소제목 중 키워드와 가장 잘 어울리는 1~2개만 골라 "${keyword}"를 자연스럽게 넣어 고치기. "## " 로 시작하는 형식 유지. 억지스러우면 1개만.

JSON 하나만 출력: {"first_paragraph":"고친 첫 문단","headings":[{"n":번호,"text":"## 고친 소제목"}]}`;

  const anthropic = new Anthropic({ apiKey });
  let ok = false;
  let usage = { input: 0, output: 0 };
  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: prompt }],
    });
    usage = { input: msg.usage.input_tokens, output: msg.usage.output_tokens };
    const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const j = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as {
      first_paragraph?: string;
      headings?: { n: number; text: string }[];
    };

    const out = [...lines];
    const changes: { before: string; after: string }[] = [];
    // 소제목 먼저 (줄 번호가 바뀌지 않게)
    for (const h of (Array.isArray(j.headings) ? j.headings : []).slice(0, 2)) {
      const target = headings[Number(h.n)];
      const t = String(h.text ?? "").trim();
      if (!target || !/^##\s/.test(t) || t === target.l) continue;
      out[target.i] = t.slice(0, 120);
      changes.push({ before: target.l, after: out[target.i] });
    }
    const fp = String(j.first_paragraph ?? "").trim();
    if (pStart !== -1 && fp && fp !== firstPara.trim()) {
      out.splice(pStart, pEnd - pStart, ...fp.split("\n"));
      changes.unshift({ before: firstPara, after: fp });
    }
    ok = true;
    return Response.json({ content: out.join("\n"), changes });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? `반영 실패: ${e.message}` : "반영 실패" }, { status: 502 });
  } finally {
    await recordAiRun({
      userId: session.user.id,
      action: "blog_keyword",
      calls: 1,
      input: usage.input,
      output: usage.output,
      usd: (usage.input * 2 + usage.output * 10) / 1_000_000,
      ok,
    });
  }
}
