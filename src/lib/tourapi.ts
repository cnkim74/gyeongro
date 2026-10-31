// 한국관광공사 국문 관광정보 서비스 (TourAPI, KorService2) — 서버 전용
//
// End Point: https://apis.data.go.kr/B551011/KorService2
// 환경변수: TOURAPI_SERVICE_KEY (공공데이터포털 '일반 인증키')
//
// - 응답은 공공데이터라 서버에서 캐시 (축제 목록 6시간, 상세 1일)
// - 화면에는 "출처: 한국관광공사" 표시
// - 키가 없거나 API 오류면 빈 결과 → 화면은 '준비 중' 안내

const BASE = "https://apis.data.go.kr/B551011/KorService2";

export interface FestivalSummary {
  contentId: string;
  title: string;
  startDate: string; // YYYYMMDD
  endDate: string; // YYYYMMDD
  addr: string;
  image: string | null;
  thumb: string | null;
  lat: number | null;
  lng: number | null;
  /** A0207 축제 / A0208 공연·행사 (없으면 null) */
  cat2: string | null;
}

export interface FestivalDetail extends FestivalSummary {
  overview: string;
  homepage: string | null;
  tel: string | null;
  place: string | null;
  playtime: string | null;
  fee: string | null;
  sponsor: string | null;
  ageLimit: string | null;
  images: string[];
}

type Item = Record<string, string | number | undefined>;

/** http 이미지 → https (혼합 콘텐츠 방지) */
function https(url: unknown): string | null {
  if (typeof url !== "string" || !url.trim()) return null;
  return url.trim().replace(/^http:\/\//, "https://");
}

function str(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

/** TourAPI 텍스트의 HTML 태그 제거 (<br> 은 줄바꿈으로) */
export function cleanText(html: unknown): string {
  return str(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function tourGet(op: string, params: Record<string, string>, revalidate: number): Promise<Item[]> {
  return (await tourGetPage(op, params, revalidate)).items;
}

async function tourGetPage(
  op: string,
  params: Record<string, string>,
  revalidate: number
): Promise<{ items: Item[]; totalCount: number }> {
  const empty = { items: [] as Item[], totalCount: 0 };
  const key = process.env.TOURAPI_SERVICE_KEY;
  if (!key) return empty;
  const qs = new URLSearchParams({
    MobileOS: "ETC",
    MobileApp: "Pothos",
    _type: "json",
    ...params,
  });
  // 인증키는 포털에서 받은 그대로 (이미 인코딩된 키면 그대로, 아니면 인코딩)
  const keyParam = /%[0-9A-Fa-f]{2}/.test(key) ? key : encodeURIComponent(key);
  const url = `${BASE}/${op}?serviceKey=${keyParam}&${qs.toString()}`;
  try {
    const res = await fetch(url, { next: { revalidate } });
    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      // 키 오류 등은 XML 로 옴
      console.log(`[tourapi] ${op} non-json status=${res.status} body=${text.slice(0, 200)}`);
      return empty;
    }
    const body = (data as {
      response?: {
        header?: { resultCode?: string; resultMsg?: string };
        body?: { items?: { item?: Item | Item[] } | ""; totalCount?: number };
      };
    }).response;
    if (body?.header?.resultCode && body.header.resultCode !== "0000") {
      console.log(`[tourapi] ${op} resultCode=${body.header.resultCode} msg=${body.header.resultMsg}`);
      return empty;
    }
    const totalCount = Number(body?.body?.totalCount ?? 0) || 0;
    const items = body?.body?.items;
    if (!items || typeof items === "string" || !items.item) return { items: [], totalCount };
    return { items: Array.isArray(items.item) ? items.item : [items.item], totalCount };
  } catch (e) {
    console.log(`[tourapi] ${op} fetch failed: ${e instanceof Error ? e.message : e}`);
    return empty;
  }
}

function toSummary(it: Item): FestivalSummary {
  const lng = Number(it.mapx);
  const lat = Number(it.mapy);
  return {
    contentId: str(it.contentid),
    title: cleanText(it.title),
    startDate: str(it.eventstartdate),
    endDate: str(it.eventenddate),
    addr: str(it.addr1),
    image: https(it.firstimage),
    thumb: https(it.firstimage2) ?? https(it.firstimage),
    lat: Number.isFinite(lat) && lat !== 0 ? lat : null,
    lng: Number.isFinite(lng) && lng !== 0 ? lng : null,
    cat2: str(it.cat2) || null,
  };
}

export function isTourApiEnabled(): boolean {
  return !!process.env.TOURAPI_SERVICE_KEY;
}

/**
 * 기간 내 진행되는 축제·행사 목록
 * @param from YYYYMMDD — 이 날짜 이후 종료되는 행사
 * @param to   YYYYMMDD — 이 날짜 이전에 시작하는 행사 (선택)
 */
export async function listFestivals(from: string, to?: string): Promise<FestivalSummary[]> {
  // eventEndDate 는 "그 날짜까지 끝나는 행사"로 걸러져 범위가 지나치게 좁아지므로 쓰지 않고,
  // eventStartDate(from) 이후 진행되는 행사를 모두 받아 기간은 서버에서 직접 거름
  const ROWS = 1000;
  const all: Item[] = [];
  let total = 0;
  for (let page = 1; page <= 5; page++) {
    const { items, totalCount } = await tourGetPage(
      "searchFestival2",
      { eventStartDate: from, numOfRows: String(ROWS), pageNo: String(page), arrange: "A" },
      6 * 3600
    );
    total = totalCount;
    all.push(...items);
    if (items.length < ROWS || all.length >= totalCount) break;
  }
  const list = all
    .map(toSummary)
    .filter((f) => f.contentId && f.title)
    .filter((f) => !f.endDate || f.endDate >= from)
    .filter((f) => !to || !f.startDate || f.startDate <= to)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  console.log(`[tourapi] searchFestival2 from=${from} to=${to ?? "-"} total=${total} fetched=${all.length} shown=${list.length}`);
  return list;
}

export async function getFestival(contentId: string): Promise<FestivalDetail | null> {
  if (!/^\d{1,12}$/.test(contentId)) return null;
  const [common, intro, imgs] = await Promise.all([
    tourGet("detailCommon2", { contentId }, 24 * 3600),
    tourGet("detailIntro2", { contentId, contentTypeId: "15" }, 24 * 3600),
    tourGet("detailImage2", { contentId, imageYN: "Y" }, 24 * 3600),
  ]);
  const c = common[0];
  if (!c) return null;
  const i = intro[0] ?? {};
  const base = toSummary({ ...c, eventstartdate: i.eventstartdate, eventenddate: i.eventenddate });
  const homepageRaw = str(c.homepage);
  const homepage = homepageRaw.match(/https?:\/\/[^\s"'<>]+/)?.[0] ?? null;
  return {
    ...base,
    overview: cleanText(c.overview),
    homepage,
    tel: str(c.tel) || str(i.sponsor1tel) || null,
    place: cleanText(i.eventplace) || null,
    playtime: cleanText(i.playtime) || null,
    fee: cleanText(i.usetimefestival) || null,
    sponsor: cleanText(i.sponsor1) || null,
    ageLimit: cleanText(i.agelimit) || null,
    images: imgs.map((x) => https(x.originimgurl)).filter((u): u is string => !!u).slice(0, 8),
  };
}

// ── 날짜·지역 헬퍼 ─────────────────────────────────────────
export function ymd(d: Date): string {
  const kst = new Date(d.getTime() + 9 * 3600 * 1000);
  return kst.toISOString().slice(0, 10).replace(/-/g, "");
}

export function formatYmd(s: string): string {
  return /^\d{8}$/.test(s) ? `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}` : s;
}

/** 주소 → 시·도 (필터용 짧은 이름) */
export const REGIONS = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
] as const;

export function regionOf(addr: string): string | null {
  const a = addr.trim();
  const map: [RegExp, string][] = [
    [/^서울/, "서울"], [/^부산/, "부산"], [/^대구/, "대구"], [/^인천/, "인천"],
    [/^광주/, "광주"], [/^대전/, "대전"], [/^울산/, "울산"], [/^세종/, "세종"],
    [/^경기/, "경기"], [/^강원/, "강원"], [/^충청북도|^충북/, "충북"], [/^충청남도|^충남/, "충남"],
    [/^전라북도|^전북/, "전북"], [/^전라남도|^전남/, "전남"], [/^경상북도|^경북/, "경북"],
    [/^경상남도|^경남/, "경남"], [/^제주/, "제주"],
  ];
  return map.find(([re]) => re.test(a))?.[1] ?? null;
}

/** 주소 → 플래너 목적지 (예: "강원특별자치도 강릉시 ..." → "강릉") */
export function destinationOf(addr: string): string {
  const parts = addr.trim().split(/\s+/);
  const sido = parts[0] ?? "";
  if (/^제주/.test(sido)) return "제주도";
  const sigungu = parts[1] ?? "";
  // 광역시·특별시는 시 이름, 도는 시·군 이름
  if (/특별시$|광역시$|특별자치시$/.test(sido)) return sido.replace(/특별시$|광역시$|특별자치시$/, "");
  if (sigungu) return sigungu.replace(/(시|군)$/, "") || sigungu;
  return sido;
}
