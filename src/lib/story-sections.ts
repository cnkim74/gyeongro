// 스토리 챕터 저장 전 정리 (서버) — 모르는 값·위험한 주소 제거, 길이 제한

const url = (v: unknown, max = 500): string => {
  if (typeof v !== "string") return "";
  const t = v.trim();
  return /^https:\/\/\S+$/.test(t) || /^\/(?!\/)\S*$/.test(t) ? t.slice(0, max) : "";
};
const text = (v: unknown, max: number): string => (typeof v === "string" ? v.slice(0, max) : "");

export interface CleanSection {
  title: string;
  image_url: string;
  content: string;
  image_credit?: string;
  image_credit_url?: string;
  videos?: { url: string; title: string }[];
  links?: { label: string; url: string }[];
}

export function cleanSections(input: unknown): CleanSection[] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, 30)
    .map((raw) => {
      const s = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
      const out: CleanSection = {
        title: text(s.title, 200).trim(),
        image_url: url(s.image_url),
        content: text(s.content, 20000),
      };
      const credit = text(s.image_credit, 200).trim();
      if (credit) out.image_credit = credit;
      const creditUrl = url(s.image_credit_url);
      if (creditUrl) out.image_credit_url = creditUrl;
      const videos = (Array.isArray(s.videos) ? s.videos : [])
        .map((v) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {}))
        .map((v) => ({ url: url(v.url), title: text(v.title, 150).trim() }))
        .filter((v) => /youtu\.?be/.test(v.url))
        .slice(0, 4);
      if (videos.length) out.videos = videos;
      const links = (Array.isArray(s.links) ? s.links : [])
        .map((l) => (l && typeof l === "object" ? (l as Record<string, unknown>) : {}))
        .map((l) => ({ label: text(l.label, 150).trim(), url: url(l.url) }))
        .filter((l) => l.url)
        .slice(0, 12);
      if (links.length) out.links = links;
      return out;
    })
    .filter((s) => s.title || s.content || s.image_url || s.videos || s.links);
}
