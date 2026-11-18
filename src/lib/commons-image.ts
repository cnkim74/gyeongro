// 위키미디어 공용(Commons)에서 자유 이용 사진 찾기 — 서버 전용
// 1) 영어 위키백과에서 행사 이름으로 문서를 찾아 대표 사진(자유 라이선스만, pilicense=free)
// 2) 없으면 Commons 에서 직접 검색
// 3) Commons 에서 라이선스·저작자 확인 (CC0 · 퍼블릭 도메인 · CC BY · CC BY-SA 만)
// 반환: 가로 1000px 썸네일 주소 + 출처 표기

const UA = "PothosStoryBot/1.0 (https://pothostravel.com)";
const ALLOWED = /^(cc0|public domain|pd|cc by(-sa)?( \d(\.\d)?)?)/i;

export type FreeImage = { url: string; credit: string; creditUrl: string };

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

const strip = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const GENERIC = new Set(["the", "of", "and", "festival", "fair", "international", "world", "expo", "show", "week", "day", "new", "year", "annual", "carnival"]);
/** 행사 이름의 핵심 단어 (흔한 단어 제외) */
const keyWords = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !GENERIC.has(w));
/** 제목에 핵심 단어가 하나 이상 들어 있어야 관련 사진으로 인정 */
const related = (title: string, words: string[]) => {
  const t = title.toLowerCase().replace(/_/g, " ");
  return words.length === 0 || words.some((w) => t.includes(w));
};

/** Commons 파일 → 라이선스 확인 + 썸네일 */
async function fileInfo(file: string): Promise<FreeImage | null> {
  const title = file.startsWith("File:") ? file : `File:${file}`;
  const j = await getJson<{
    query?: { pages?: Record<string, { imageinfo?: { thumburl?: string; width?: number; height?: number; descriptionurl?: string; extmetadata?: Record<string, { value?: string }> }[] }> };
  }>(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1000`
  );
  const info = Object.values(j?.query?.pages ?? {})[0]?.imageinfo?.[0];
  if (!info?.thumburl) return null;
  const lic = strip(info.extmetadata?.LicenseShortName?.value ?? "");
  if (!ALLOWED.test(lic)) return null;
  // 너무 작거나 세로로 긴 사진은 카드 배경으로 어색함
  if ((info.width ?? 0) < 800 || (info.height ?? 0) > (info.width ?? 0) * 1.4) return null;
  const artist = strip(info.extmetadata?.Artist?.value ?? "") || strip(info.extmetadata?.Credit?.value ?? "") || "Unknown";
  return {
    url: info.thumburl.replace(/\?utm_[^#]*$/, ""),
    credit: `${artist.slice(0, 80).replace(/[,\s]+$/, "")} · ${lic} · Wikimedia Commons`,
    creditUrl: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
  };
}

/** 행사 이름(영문)·도시로 자유 이용 사진 찾기 — 못 찾으면 null */
export async function findFreeImage(nameEn: string, city?: string): Promise<FreeImage | null> {
  const name = nameEn.trim();
  if (!name) return null;
  const words = keyWords(name);
  // 1) 위키백과 대표 사진 (자유 라이선스만)
  const wp = await getJson<{ query?: { pages?: Record<string, { title?: string; pageimage?: string; index?: number }> } }>(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(name)}&gsrlimit=3&prop=pageimages&piprop=name&pilicense=free`
  );
  // 검색 순위대로 (객체 순서는 검색 순위가 아님)
  const pages = Object.values(wp?.query?.pages ?? {}).sort((a, b) => (a.index ?? 99) - (b.index ?? 99));
  for (const p of pages) {
    if (!p.pageimage || /\.svg$/i.test(p.pageimage) || /logo/i.test(p.pageimage)) continue;
    // 행사 문서가 맞는지 (도시 문서 등 엉뚱한 문서의 사진 방지)
    if (!related(p.title ?? "", words)) continue;
    const img = await fileInfo(p.pageimage);
    if (img) return img;
  }
  // 2) Commons 직접 검색 (행사 이름 → 행사 이름 + 도시)
  for (const q of [name, city ? `${name} ${city}` : ""].filter(Boolean)) {
    const cs = await getJson<{ query?: { search?: { title: string }[] } }>(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srnamespace=6&srlimit=8&srsearch=${encodeURIComponent(`${q} filetype:bitmap`)}`
    );
    for (const hit of cs?.query?.search ?? []) {
      if (/logo|map|poster|flag|icon/i.test(hit.title) || !related(hit.title, words)) continue;
      const img = await fileInfo(hit.title);
      if (img) return img;
    }
  }
  return null;
}
