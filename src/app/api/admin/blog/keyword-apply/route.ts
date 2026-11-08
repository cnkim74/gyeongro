// 핵심·보조 키워드를 본문에 자연스럽게 반영 (관리자)
// POST { keyword, related?: string[], content } -> { content, changes: [{ before, after }], skipped: string[] }
//  - 핵심 키워드: 첫 문단 + ## 소제목 1~2개 (이미 들어가 있으면 건드리지 않음)
//  - 보조 키워드(본문에 없는 것만): 관련 있는 문단·소제목의 문장을 살짝 다듬어 1번씩
// 본문 전체를 새로 쓰지 않고, AI가 준 문장으로 해당 덩어리만 바꿔 끼움. 사실 추가 금지.
import Anthropic from "@anthropic-ai/sdk";
import { requireAdmin } from "@/lib/admin";
import { recordAiRun } from "@/lib/ai-runs";
import { keywordChecks } from "@/lib/blog-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const MODEL = "claude-sonnet-5-5";

type Block = { start: number; end: number; text: string; kind: "para" | "heading" };

/** 본문을 문단·소제목 덩어리로 나눔 (표·사진·코드·인용·참고 자료 뒤는 제외) */
function blocksOf(lines: string[]): Block[] {
  const out: Block[] = [];
  let inFence = false;
  let stop = false;
  let cur: { start: number; lines: string[] } | null = null;
  const flush = (end: number) => {
    if (!cur) return;
    const text = cur.lines.join("\n");
    const t = text.trim();
    const skip = t.startsWith("![") || t.startsWith("|") || t.startsWith(">") || t.startsWith("<") || t.length < 20;
    if (!skip) out.push({ start: cur.start, end, text, kind: "para" });
    cur = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const t = l.trim();
    if (t.startsWith("```")) {
      flush(i);
      inFence = !inFence;
      continue;
    }
    if (inFence || stop) continue;
    if (/^#{2,3}\s/.test(t)) {
      flush(i);
      if (/참고 자료|자주 묻는/.test(t)) {
        stop = true;
        continue;
      }
      if (!/마무리/.test(t)) out.push({ start: i, end: i + 1, text: l, kind: "heading" });
      continue;
    }
    if (!t) {
      flush(i);
      continue;
    }
    if (!cur) cur = { start: i, lines: [] };
    cur.lines.push(l);
  }
  flush(lines.length);
  return out;
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "ANTHROPIC_API_KEY 가 없어요." }, { status: 500 });
  const body = (await req.json().catch(() => ({}))) as { keyword?: string; related?: string[]; content?: string };
  const keyword = String(body.keyword ?? "").trim().slice(0, 60);
  const related = (Array.isArray(body.related) ? body.related : [])
    .map((k) => String(k).trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, 8);
  const content = String(body.content ?? "");
  if (!content.trim() || (!keyword && related.length === 0)) {
    return Response.json({ error: "키워드와 본문이 필요해요." }, { status: 400 });
  }

  const lines = content.split("\n");
  const blocks = blocksOf(lines);
  if (blocks.length === 0) return Response.json({ error: "고칠 문단을 찾지 못했어요." }, { status: 400 });

  // 핵심 키워드가 첫 문단·소제목에 이미 있으면 그 작업은 건너뜀
  const checks = keyword ? keywordChecks(keyword, { title: "", excerpt: "", content }) : [];
  const needFirst = checks.some((c) => !c.ok && c.label.startsWith("첫 문단"));
  const needHeading = checks.some((c) => !c.ok && c.label.startsWith("소제목"));

  const listing = blocks
    .map((b, n) => `[${n}] ${b.kind === "heading" ? "(소제목) " : ""}${b.text.length > 600 ? b.text.slice(0, 600) + "…" : b.text}`)
    .join("\n\n");

  const tasks: string[] = [];
  if (needFirst) tasks.push(`- 첫 문단(가장 앞의 일반 문단)의 첫 문장에 핵심 키워드 "${keyword}"가 자연스럽게 들어가게.`);
  if (needHeading) tasks.push(`- 소제목 중 가장 잘 어울리는 1~2개에 핵심 키워드 "${keyword}"를 자연스럽게 (억지스러우면 1개만).`);
  if (related.length) {
    tasks.push(
      `- 보조 키워드 ${related.map((k) => `"${k}"`).join(", ")} 를 각각 1번씩, 그 내용을 이미 다루는 문단이나 소제목에 문구 그대로 자연스럽게 넣기.\n  그 내용을 다루는 곳이 없어서 넣으면 어색하거나 사실을 새로 지어내야 하는 키워드는 넣지 말고 skipped 에 적기.`
    );
  }
  if (tasks.length === 0) return Response.json({ content, changes: [], skipped: [] });

  const prompt = `여행 블로그 글의 검색 노출을 위해 키워드를 본문에 자연스럽게 반영하려고 해요.

[본문 덩어리 — 번호: 내용]
${listing}

해 줄 일:
${tasks.join("\n")}

규칙:
- 고치는 덩어리는 꼭 필요한 것만 (최대 8곳). 한 덩어리에 키워드를 여러 개 몰아넣지 말 것.
- 원래 내용·말투·길이를 최대한 유지. 사실(수치·장소·날짜)을 새로 추가하거나 바꾸지 말 것. 단어 바꾸기·구절 하나 덧붙이기 수준으로.
- 소제목은 원래 앞의 "## " 또는 "### " 형식을 그대로 유지.
- 문단 안의 마크다운(굵게, 링크, 목록 기호)은 그대로 유지.

JSON 하나만 출력: {"edits":[{"n":번호,"text":"고친 전체 내용"}],"skipped":["넣지 않은 키워드"]}`;

  const anthropic = new Anthropic({ apiKey });
  let ok = false;
  let usage = { input: 0, output: 0 };
  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 6000,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: prompt }],
    });
    usage = { input: msg.usage.input_tokens, output: msg.usage.output_tokens };
    const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const j = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as {
      edits?: { n: number; text: string }[];
      skipped?: string[];
    };

    // 검증된 수정만 모아서, 뒤쪽 줄부터 바꿔 끼움 (앞 줄 번호가 밀리지 않게)
    const used = new Set<number>();
    const edits: { b: Block; after: string }[] = [];
    for (const e of (Array.isArray(j.edits) ? j.edits : []).slice(0, 8)) {
      const n = Number(e.n);
      const b = blocks[n];
      const after = String(e.text ?? "").trim();
      if (!b || used.has(n) || !after || after === b.text.trim()) continue;
      if (b.kind === "heading") {
        const level = b.text.trim().match(/^#+\s/)?.[0];
        if (!level || !after.startsWith(level) || after.includes("\n")) continue;
        if (after.length > 120) continue;
      } else {
        if (/^#/.test(after)) continue;
        // 지나치게 길어진 수정은 버림 (새 내용을 지어냈을 가능성)
        if (after.length > b.text.length * 1.5 + 80) continue;
      }
      used.add(n);
      edits.push({ b, after });
    }
    const out = [...lines];
    for (const { b, after } of [...edits].sort((x, y) => y.b.start - x.b.start)) {
      out.splice(b.start, b.end - b.start, ...after.split("\n"));
    }
    const changes = [...edits].sort((x, y) => x.b.start - y.b.start).map(({ b, after }) => ({ before: b.text, after }));
    ok = true;
    return Response.json({
      content: out.join("\n"),
      changes,
      skipped: (Array.isArray(j.skipped) ? j.skipped : []).map(String).filter((k) => related.includes(k)),
    });
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
