// 블로그 AI 작성기 — 서버 전용
//
// 1) Claude 가 (주제가 없으면 직접 골라) 웹 검색으로 사실을 확인하며 글을 씀
//    → 홈페이지 글(마크다운) + 네이버 블로그 원고 + 스레드 홍보 글 + FAQ·태그·대표 이미지 색
// 2) 위키미디어 공용(Wikimedia Commons)에서 CC 라이선스 사진을 찾아 대표·본문 사진으로 넣고 출처 표기
// 3) 실제 토큰 비용을 ai_runs 에 기록 (관리자 'AI 사용량·비용')

import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServiceClient } from "./supabase";
import { recordAiRun } from "./ai-runs";
import { COVER_STYLE_KEYS, isCoverStyle, normalizeFaq, normalizeSlug, type BlogFaq } from "./blog-utils";
import type { BlogAutoSettings } from "./blog-auto";

const MODEL = "claude-sonnet-5-5";
const PRICE = { input: 2, output: 10 }; // USD / 100만 토큰
const SEARCH_USD = 0.01; // 웹 검색 1회
const SITE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://pothostravel.com";

export interface WrittenPost {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  tags: string[];
  faq: BlogFaq[];
  cover_style: string;
  cover_image_url: string | null;
  naver_draft: string;
  threads_text: string;
  topic: string;
  costUsd: number;
}

function tag(text: string, name: string): string {
  const m = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, "i").exec(text);
  return m ? m[1].trim() : "";
}

// ── 위키미디어 공용 사진 ──────────────────────────────

interface CommonsPhoto {
  url: string;
  credit: string;
  page: string;
}

async function commonsSearch(query: string): Promise<CommonsPhoto | null> {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "10",
    prop: "imageinfo",
    iiprop: "url|extmetadata|size",
    iiurlwidth: "1600",
    format: "json",
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
        headers: { "User-Agent": "PothosBlog/1.0 (https://pothostravel.com)" },
        signal: AbortSignal.timeout(15000),
      });
      if (r.status === 429) {
        await new Promise((res) => setTimeout(res, 8000));
        continue;
      }
      if (!r.ok) return null;
      const j = (await r.json()) as {
        query?: { pages?: Record<string, { index?: number; imageinfo?: { thumburl?: string; width: number; height: number; descriptionurl: string; extmetadata?: Record<string, { value?: string }> }[] }> };
      };
      const pages = Object.values(j.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
      for (const p of pages) {
        const ii = p.imageinfo?.[0];
        if (!ii?.thumburl) continue;
        const lic = ii.extmetadata?.LicenseShortName?.value ?? "";
        if (!/CC BY|CC0|Public domain/i.test(lic)) continue;
        if (ii.width < 1000 || ii.width < ii.height * 1.2) continue; // 가로 사진만
        const artist = (ii.extmetadata?.Artist?.value ?? "").replace(/<[^>]+>/g, "").trim().slice(0, 60) || "Unknown";
        return { url: ii.thumburl.split("?")[0], credit: `${artist} · ${lic} · Wikimedia Commons`, page: ii.descriptionurl };
      }
      return null;
    } catch {
      return null;
    }
  }
  return null;
}

/** 본문 n번째 ## 제목 바로 아래에 사진 넣기 */
function insertAfterHeading(content: string, n: number, md: string): string {
  const lines = content.split("\n");
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) {
      count++;
      if (count === n) {
        lines.splice(i + 1, 0, "", md, "");
        return lines.join("\n");
      }
    }
  }
  return content;
}

// ── 글쓰기 ──────────────────────────────────────

export async function writeBlogPost(opts: {
  topic?: string;
  settings: BlogAutoSettings;
  userId?: string | null;
}): Promise<WrittenPost> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY 가 없어요.");
  const anthropic = new Anthropic({ apiKey });
  const supabase = getSupabaseServiceClient();

  // 최근 글 제목 (주제 중복 방지)
  const { data: recent } = await supabase
    .from("blog_posts")
    .select("title")
    .order("created_at", { ascending: false })
    .limit(40);
  const recentTitles = (recent ?? []).map((r) => r.title as string);

  const today = new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" });
  const topic = (opts.topic ?? "").trim();
  const s = opts.settings;

  const prompt = `당신은 여행 서비스 Pothos(${SITE})의 블로그 에디터입니다. 오늘은 ${today}입니다.

[블로그 컨셉]
${s.concept}

[주제]
${
  topic
    ? topic
    : `주제가 정해지지 않았어요. 지금 시기(계절·연휴·축제·항공권 수요)를 고려해 한국 자유여행자가 요즘 실제로 많이 검색할 만한 구체적인 여행 주제 하나를 직접 고르세요. 너무 넓은 주제(예: "일본 여행")보다 검색 의도가 분명한 주제(예: "삿포로 눈축제 2박 3일 일정과 예산")가 좋아요.`
}

[최근에 쓴 글 — 비슷한 주제는 피하세요]
${recentTitles.length ? recentTitles.map((t) => `- ${t}`).join("\n") : "(없음)"}

[작성 규칙]
- 웹 검색으로 날짜·요금·운영 시간·제도 같은 사실을 확인하고, 확인하지 못한 수치는 "대략", "시기에 따라 다름"처럼 표현하세요. 지어내지 마세요.
- 한국어, 친근하지만 과장 없는 정보형 문체. 실제 여행자에게 도움이 되는 구체적인 내용 위주.
- 본문은 마크다운. 첫 문단은 도입(2~3문장), 그 뒤 ## 큰 제목 4~7개 (목차로 쓰임). 필요하면 ### 작은 제목.
- 표 1개 이상(일정·비용·비교 등), 목록 활용, "> 💡 " 로 시작하는 팁 박스 1~2개.
- 체크리스트 카드 1개: 아래처럼 \`\`\`checklist 코드 블록 (첫 줄 제목, 다음 줄부터 항목 4~6개)
\`\`\`checklist
출발 전 꼭 확인할 것
항목 1
항목 2
\`\`\`
- 본문 2,500~4,000자. 맨 끝은 "## 마무리" 로, [Pothos AI 플래너](/planner)로 일정을 만들어 보도록 자연스럽게 안내.
- 마무리 뒤에 "## 참고 자료" 로 실제 확인한 출처 링크 2~5개 (마크다운 링크).
- 본문에 사진 마크다운은 넣지 마세요 (사진은 따로 넣어요).
- slug 는 영문 소문자·숫자·하이픈으로 3~6단어 (예: sapporo-snow-festival-itinerary).
- cover_style 은 글 분위기에 어울리는 색 하나: ${COVER_STYLE_KEYS.join(", ")}.
- photo_query 는 위키미디어 공용에서 대표 사진을 찾을 영어 검색어 (구체적인 장소명, 예: "Sapporo Snow Festival Odori"). photo_query_2 는 본문용 다른 장소/장면.
- naver_draft: 같은 주제의 네이버 블로그용 원고 (홈페이지 글과 문장을 그대로 복사하지 말고 새로 쓰기 — 중복 문서 방지). 소제목은 【 】, 짧은 문단과 줄바꿈, 이모지 약간, 1,500~2,500자. 마지막 줄에 "더 자세한 일정과 예산은 Pothos 블로그에서 👉 {URL}" 을 넣고, 그 아래 해시태그 8~12개.
- threads_text: 스레드 홍보 글 300자 이내. 첫 줄 후킹, 핵심 3줄 요약, 마지막 줄 "{URL}". 해시태그 2~3개.

[출력 형식 — 아래 태그만, 다른 설명 없이]
<title>제목 (40자 이내, 검색 키워드 포함)</title>
<slug>영문-슬러그</slug>
<category>대표 해시태그 1개 (띄어쓰기 없이, 예: 일본여행)</category>
<excerpt>요약 1~2문장 (120자 이내)</excerpt>
<tags>태그1, 태그2, 태그3, 태그4, 태그5</tags>
<cover_style>색</cover_style>
<photo_query>영어 검색어</photo_query>
<photo_query_2>영어 검색어</photo_query_2>
<faq>Q: 질문1
A: 답변1
Q: 질문2
A: 답변2
Q: 질문3
A: 답변3</faq>
<content>마크다운 본문</content>
<naver_draft>네이버 원고</naver_draft>
<threads_text>스레드 글</threads_text>`;

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];
  let text = "";
  let usd = 0;
  let calls = 0;
  let inTok = 0;
  let outTok = 0;
  let ok = false;
  try {
    for (let i = 0; i < 4; i++) {
      const msg = await anthropic.messages
        .stream({
          model: MODEL,
          max_tokens: 16000,
          output_config: { effort: "medium" },
          tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
          messages,
        })
        .finalMessage();
      calls++;
      inTok += msg.usage.input_tokens;
      outTok += msg.usage.output_tokens;
      const searches = msg.usage.server_tool_use?.web_search_requests ?? 0;
      usd += (msg.usage.input_tokens * PRICE.input + msg.usage.output_tokens * PRICE.output) / 1_000_000 + searches * SEARCH_USD;
      if (msg.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: msg.content });
        continue;
      }
      text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
      break;
    }

    const title = tag(text, "title").replace(/^["']|["']$/g, "").slice(0, 150);
    let content = tag(text, "content");
    if (!title || content.length < 500) throw new Error("AI가 글을 완성하지 못했어요. 다시 시도해 주세요.");

    const faq = normalizeFaq(
      tag(text, "faq")
        .split(/\n(?=Q[:：])/)
        .map((blk) => {
          const q = /Q[:：]\s*([\s\S]*?)(?:\nA[:：]|$)/.exec(blk)?.[1]?.trim() ?? "";
          const a = /A[:：]\s*([\s\S]*)$/.exec(blk)?.[1]?.trim() ?? "";
          return { q, a };
        })
    );

    const styleRaw = tag(text, "cover_style").toLowerCase();
    const cover_style = s.coverMode === "fixed" ? s.coverStyle : isCoverStyle(styleRaw) ? styleRaw : s.coverStyle;

    // 사진 (실패해도 글은 그대로 — 대표 이미지는 템플릿 색으로)
    let cover_image_url: string | null = null;
    if (s.photos) {
      const q1 = tag(text, "photo_query");
      const q2 = tag(text, "photo_query_2");
      const p1 = q1 ? await commonsSearch(q1) : null;
      if (p1) {
        cover_image_url = p1.url;
        content = insertAfterHeading(content, 1, `![${title}](${p1.url} "사진: ${p1.credit.replace(/"/g, "'")}")`);
      }
      const p2 = q2 ? await commonsSearch(q2) : null;
      if (p2 && p2.url !== p1?.url) {
        content = insertAfterHeading(content, 3, `![${q2}](${p2.url} "사진: ${p2.credit.replace(/"/g, "'")}")`);
      }
    }

    ok = true;
    return {
      title,
      slug: normalizeSlug(tag(text, "slug")),
      category: tag(text, "category").replace(/^#/, "").replace(/\s+/g, "").slice(0, 30),
      excerpt: tag(text, "excerpt").slice(0, 300),
      content: content.slice(0, 100_000),
      tags: tag(text, "tags")
        .split(/[,，]/)
        .map((t) => t.replace(/^#/, "").trim())
        .filter(Boolean)
        .slice(0, 10),
      faq,
      cover_style,
      cover_image_url,
      naver_draft: tag(text, "naver_draft").slice(0, 20_000),
      threads_text: tag(text, "threads_text").slice(0, 2000),
      topic: topic || title,
      costUsd: usd,
    };
  } finally {
    await recordAiRun({
      userId: opts.userId ?? null,
      action: "blog",
      calls,
      input: inTok,
      output: outTok,
      usd,
      ok,
      meta: { topic: topic || null },
    });
  }
}

/** 작성한 글 저장 (slug 중복이면 뒤에 숫자) */
export async function saveWrittenPost(
  post: WrittenPost,
  opts: { publish: boolean; authorId?: string | null }
): Promise<{ id: string; slug: string }> {
  const supabase = getSupabaseServiceClient();
  const base = post.slug || `travel-${Date.now().toString(36)}`;
  let slug = base;
  for (let i = 2; i < 20; i++) {
    const { data } = await supabase.from("blog_posts").select("id").eq("slug", slug).maybeSingle();
    if (!data) break;
    slug = `${base}-${i}`;
  }
  const url = `${SITE}/blog/${slug}`;
  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      slug,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      cover_image_url: post.cover_image_url,
      cover_style: post.cover_style,
      content: post.content,
      tags: post.tags,
      faq: post.faq,
      is_published: opts.publish,
      published_at: opts.publish ? new Date().toISOString() : null,
      author_id: opts.authorId ?? null,
      source: "ai",
      topic: post.topic,
      naver_draft: post.naver_draft.replaceAll("{URL}", url),
      threads_text: post.threads_text.replaceAll("{URL}", url),
      naver_posted: false,
    })
    .select("id, slug")
    .single();
  if (error) {
    if (/column .* does not exist|cover_style|naver_draft|source/i.test(error.message)) {
      throw new Error("자동 작성용 DB 항목이 없어요. supabase/migration_blog_auto.sql 을 실행해 주세요.");
    }
    throw new Error(error.message);
  }
  return data as { id: string; slug: string };
}
