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
