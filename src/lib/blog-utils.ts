// 블로그 공용 도우미 (서버·클라이언트 공용 — 서버 전용 코드 없음)

export interface BlogFaq {
  q: string;
  a: string;
}

/** 읽는 시간 (한국어 분당 약 500자) */
export function readMinutes(content: string): number {
  const chars = content.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/[#*>`|\-\s]/g, "").length;
  return Math.max(1, Math.round(chars / 500));
}

/** 제목 → 목차용 id (한글 유지) */
export function headingId(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[*_`~[\]()!]/g, "")
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "section"
  );
}

/** 본문의 ## 제목으로 목차 만들기 */
export function tocOf(content: string): { id: string; text: string }[] {
  const out: { id: string; text: string }[] = [];
  let inCode = false;
  for (const line of content.split("\n")) {
    if (line.trim().startsWith("```")) inCode = !inCode;
    if (inCode) continue;
    const m = /^##\s+(.+?)\s*#*$/.exec(line);
    if (m) {
      const text = m[1].replace(/[*_`]/g, "").trim();
      out.push({ id: headingId(text), text });
    }
  }
  return out;
}

export function formatBlogDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

/** 주소용 slug 정리 (영문·숫자·하이픈) */
export function normalizeSlug(v: string): string {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function normalizeFaq(v: unknown): BlogFaq[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
    .map((x) => ({ q: String(x.q ?? "").trim().slice(0, 200), a: String(x.a ?? "").trim().slice(0, 2000) }))
    .filter((x) => x.q && x.a)
    .slice(0, 12);
}

/** 커버 그라데이션 (커버 사진 없을 때) — 글마다 고정 색 */
const COVER_GRADIENTS = [
  "from-sky-600 via-blue-700 to-indigo-900",
  "from-emerald-600 via-teal-700 to-slate-900",
  "from-rose-500 via-orange-600 to-amber-800",
  "from-violet-600 via-purple-700 to-indigo-900",
  "from-cyan-600 via-sky-700 to-blue-900",
  "from-amber-500 via-orange-600 to-rose-800",
];
export function coverGradient(seed: string): string {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COVER_GRADIENTS[h % COVER_GRADIENTS.length];
}

/** 대표 이미지 템플릿 색 (사진 위에 덮거나, 사진 없을 때 배경) */
export const COVER_STYLES: Record<string, { label: string; from: string; to: string }> = {
  midnight: { label: "미드나잇", from: "#0b1533", to: "#1e293b" },
  blue: { label: "블루", from: "#1d4ed8", to: "#1e3a8a" },
  violet: { label: "바이올렛", from: "#7c3aed", to: "#4c1d95" },
  teal: { label: "틸", from: "#0f766e", to: "#134e4a" },
  green: { label: "그린", from: "#15803d", to: "#14532d" },
  orange: { label: "선셋", from: "#c2410c", to: "#7c2d12" },
  rose: { label: "로즈", from: "#be123c", to: "#881337" },
  charcoal: { label: "차콜", from: "#27272a", to: "#09090b" },
};
export const COVER_STYLE_KEYS = Object.keys(COVER_STYLES);

export function isCoverStyle(v: unknown): v is string {
  return typeof v === "string" && v in COVER_STYLES;
}

/**
 * AI가 쓴 자주 묻는 질문 텍스트 → [{q, a}]
 * "Q: / Q1. / **Q.** / - Q) / 질문:" 과 "A: / A1. / 답:" 등 여러 형식을 모두 받아들임
 */
export function parseFaqText(text: string): BlogFaq[] {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/\*\*/g, "").replace(/^\s*(?:[-*•]|#{1,6})\s*/, "").trim())
    .filter(Boolean);
  const Q = /^(?:Q\s*\d*|질문\s*\d*)\s*[.:：)\]]\s*/i;
  const A = /^(?:A\s*\d*|답변?\s*\d*)\s*[.:：)\]]\s*/i;
  const out: { q: string; a: string }[] = [];
  let cur: { q: string; a: string } | null = null;
  let mode: "q" | "a" | null = null;
  for (const line of lines) {
    if (Q.test(line)) {
      if (cur) out.push(cur);
      cur = { q: line.replace(Q, ""), a: "" };
      mode = "q";
    } else if (A.test(line) && cur) {
      cur.a = line.replace(A, "");
      mode = "a";
    } else if (cur && mode === "a") {
      cur.a += (cur.a ? "\n" : "") + line;
    } else if (cur && mode === "q") {
      cur.q += " " + line;
    }
  }
  if (cur) out.push(cur);
  return normalizeFaq(out);
}

/** 핵심 키워드 점검 — 검색 상위 노출에 중요한 위치에 키워드가 들어갔는지 */
export function keywordChecks(
  keyword: string,
  post: { title: string; excerpt: string; content: string }
): { ok: boolean; label: string; tip: string }[] {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return [];
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ");
  const compact = (s: string) => s.toLowerCase().replace(/\s+/g, "");
  // 띄어쓰기가 달라도 같은 키워드로 인정 ("블라디보스토크 여행" = "블라디보스토크여행")
  const has = (s: string) => norm(s).includes(kw) || compact(s).includes(compact(kw));
  const title = post.title ?? "";
  const body = post.content ?? "";
  const firstPara = body.split(/\n\s*\n/).find((p) => p.trim() && !p.trim().startsWith("#")) ?? "";
  const h2s = body.split("\n").filter((l) => /^##\s/.test(l));
  const count = (compact(body).match(new RegExp(compact(kw).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length;
  const titlePos = compact(title).indexOf(compact(kw));
  return [
    { ok: has(title), label: "제목에 키워드", tip: "검색 결과에서 가장 크게 보이는 곳이에요" },
    { ok: titlePos >= 0 && titlePos <= 6, label: "제목 앞쪽에 키워드", tip: "제목 맨 앞에 둘수록 유리해요" },
    { ok: has(post.excerpt ?? ""), label: "요약에 키워드", tip: "검색 결과 설명에 굵게 표시돼요" },
    { ok: has(firstPara), label: "첫 문단에 키워드", tip: "검색엔진이 글 주제를 판단하는 곳이에요" },
    { ok: h2s.some(has), label: `소제목에 키워드 (${h2s.filter(has).length}개)`, tip: "## 소제목 1~2개에 넣어 주세요" },
    { ok: count >= 3 && count <= 12, label: `본문 키워드 ${count}번`, tip: "3~12번이 적당해요 (너무 많으면 오히려 감점)" },
  ];
}

/** 보조 키워드 권장 개수 (핵심 키워드 제외) */
export const RELATED_MIN = 3;
export const RELATED_MAX = 8;
/** 태그(= 핵심 + 보조 키워드) 최대 개수 */
export const TAGS_MAX = 10;

export type RelatedCheck = {
  keyword: string;
  /** full: 문구 그대로 있음 · partial: 단어는 다 있지만 떨어져 있음 · none: 없음 */
  status: "full" | "partial" | "none";
  count: number;
  inHeading: boolean;
};

/**
 * 보조 키워드(태그)가 본문에 자연스럽게 들어갔는지 — 핵심 키워드와 같은 태그는 제외
 * 띄어쓰기가 달라도 같은 말로 인정, 단어가 흩어져 있으면 'partial'
 */
export function relatedKeywordChecks(tags: string[], focus: string, post: { content: string; excerpt?: string }): RelatedCheck[] {
  const compact = (s: string) => s.toLowerCase().replace(/[\s#]+/g, "");
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const text = `${post.excerpt ?? ""}\n${post.content ?? ""}`;
  const body = compact(text);
  const headings = (post.content ?? "").split("\n").filter((l) => /^#{2,3}\s/.test(l)).map(compact);
  const f = compact(focus);
  const seen = new Set<string>();
  const out: RelatedCheck[] = [];
  for (const raw of tags) {
    const keyword = raw.replace(/^#/, "").trim();
    const c = compact(keyword);
    if (!c || c === f || seen.has(c)) continue;
    seen.add(c);
    const count = (body.match(new RegExp(esc(c), "g")) ?? []).length;
    const words = keyword.toLowerCase().split(/\s+/).filter(Boolean);
    const allWords = words.length > 1 && words.every((w) => body.includes(compact(w)));
    out.push({
      keyword,
      status: count > 0 ? "full" : allWords ? "partial" : "none",
      count,
      inHeading: headings.some((h) => h.includes(c)),
    });
  }
  return out;
}

/** "a, b, #c" → ["a","b","c"] (중복 제거) */
export function parseTags(s: string): string[] {
  return [...new Set(s.split(/[,，\n]/).map((t) => t.replace(/^#/, "").trim()).filter(Boolean))];
}
