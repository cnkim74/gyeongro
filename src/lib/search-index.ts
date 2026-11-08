// 블로그 검색 노출 점검·수집 요청 — 서버 전용
//
// - 네이버: 네이버 검색 API(웹문서)로 글 제목을 검색해 우리 글 주소가 나오는지 확인
//           (NAVER_SEARCH_CLIENT_ID / NAVER_SEARCH_CLIENT_SECRET — 지도 블로그 후기와 같은 키)
// - 구글:   Google Search Console URL 검사 API (서비스 계정)
//           GOOGLE_SC_CLIENT_EMAIL / GOOGLE_SC_PRIVATE_KEY / (선택) GOOGLE_SC_SITE
// - 수집 요청: IndexNow (네이버 서치어드바이저 · Bing 등) — 키 파일은 /indexnow-key.txt (루트)

import crypto from "node:crypto";
import jwt from "jsonwebtoken";

export const SITE = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://pothostravel.com").replace(/\/$/, "");

export function postUrl(slug: string): string {
  return `${SITE}/blog/${slug}`;
}

// ── 설정 상태 (값은 노출하지 않고 있는지만) ─────────────
/** 네이버 서치어드바이저 HTML 파일 확인용 파일 (public/ 에 있음) */
const NAVER_VERIFY_FILE = "navercfa0af4118b061c5a9804d33effaa87f.html";

/** 구글: 도메인 DNS 의 TXT 기록(google-site-verification) 을 실제로 조회 */
async function googleDnsVerified(): Promise<boolean> {
  try {
    const host = new URL(SITE).host.replace(/^www\./, "");
    const r = await fetch(`https://dns.google/resolve?name=${host}&type=TXT`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    const j = (await r.json()) as { Answer?: { data?: string }[] };
    return (j.Answer ?? []).some((a) => String(a.data ?? "").includes("google-site-verification="));
  } catch {
    return false;
  }
}

/** 네이버: 확인 파일이 실제로 열리는지 */
async function naverFileVerified(): Promise<boolean> {
  try {
    const r = await fetch(`${SITE}/${NAVER_VERIFY_FILE}`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    return r.ok && (await r.text()).includes("naver-site-verification");
  } catch {
    return false;
  }
}

export async function searchSetupStatus() {
  const [googleDns, naverFile] = await Promise.all([googleDnsVerified(), naverFileVerified()]);
  return {
    naverApi: !!(process.env.NAVER_SEARCH_CLIENT_ID && process.env.NAVER_SEARCH_CLIENT_SECRET),
    googleConsole: !!(process.env.GOOGLE_SC_CLIENT_EMAIL && process.env.GOOGLE_SC_PRIVATE_KEY),
    naverVerification: !!process.env.NAVER_SITE_VERIFICATION || naverFile,
    naverHow: process.env.NAVER_SITE_VERIFICATION ? "HTML 태그" : naverFile ? "HTML 파일" : "",
    googleVerification: !!process.env.GOOGLE_SITE_VERIFICATION || googleDns,
    googleHow: googleDns ? "도메인(DNS)" : process.env.GOOGLE_SITE_VERIFICATION ? "HTML 태그" : "",
  };
}

// ── 네이버 ──────────────────────────────────────────
export type NaverResult = { status: "indexed" | "not-found" | "no-key" | "error"; rank?: number; message?: string };

function strip(s: string) {
  return s.replace(/<[^>]+>/g, "").replace(/&[a-z#0-9]+;/gi, " ").trim();
}

/**
 * 네이버 '웹문서' 검색 순위 — 키워드(또는 제목)로 검색해 상위 100개 안에서 우리 글 위치를 찾음.
 * 100위 밖이면 "제목 + pothos" 로 한 번 더 검색해 색인 여부만 확인.
 */
export async function checkNaver(query: string, slug: string): Promise<NaverResult & { inIndexOnly?: boolean }> {
  const id = process.env.NAVER_SEARCH_CLIENT_ID;
  const secret = process.env.NAVER_SEARCH_CLIENT_SECRET;
  if (!id || !secret) return { status: "no-key" };
  const target = `/blog/${slug}`;
  const host = new URL(SITE).host.replace(/^www\./, "");
  const find = async (q: string, display: number) => {
    const r = await fetch(
      `https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(q)}&display=${display}&start=1`,
      { headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret }, cache: "no-store" }
    );
    if (!r.ok) throw new Error(`네이버 API ${r.status}`);
    const j = (await r.json()) as { items?: { link: string; title: string }[] };
    const items = j.items ?? [];
    const idx = items.findIndex((it) => {
      try {
        const u = new URL(it.link);
        return u.host.replace(/^www\./, "") === host && decodeURIComponent(u.pathname).replace(/\/$/, "") === target;
      } catch {
        return false;
      }
    });
    return idx >= 0 ? { rank: idx + 1, title: strip(items[idx].title) } : null;
  };
  try {
    const hit = await find(query, 100);
    if (hit) return { status: "indexed", rank: hit.rank, message: hit.title };
    // 순위 밖 — 색인은 됐는지만 확인
    const indexed = await find(`${query} pothos`, 30);
    if (indexed) return { status: "indexed", inIndexOnly: true, message: "네이버 색인은 됐지만 이 키워드로는 100위 밖이에요" };
    return { status: "not-found" };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "오류" };
  }
}

// ── 구글 (Search Console URL 검사) ─────────────────────
export type GoogleResult = {
  status: "indexed" | "not-indexed" | "no-key" | "error";
  coverage?: string;
  lastCrawl?: string | null;
  message?: string;
};

const tokenCache = new Map<string, { token: string; exp: number }>();

/** 서비스 계정 접근 토큰 (권한 범위별로 1시간 캐시) — 서치콘솔·애널리틱스 공용 */
export async function googleToken(scope = "https://www.googleapis.com/auth/webmasters.readonly"): Promise<string> {
  const cached = tokenCache.get(scope);
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const email = process.env.GOOGLE_SC_CLIENT_EMAIL!;
  // Vercel 에 붙여 넣은 키의 \n 을 실제 줄바꿈으로
  const key = process.env.GOOGLE_SC_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    {
      iss: email,
      scope,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    },
    key,
    { algorithm: "RS256" }
  );
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const j = (await r.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!j.access_token) throw new Error(j.error_description ?? "구글 인증 실패");
  tokenCache.set(scope, { token: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 });
  return j.access_token;
}

export async function checkGoogle(slug: string): Promise<GoogleResult> {
  if (!process.env.GOOGLE_SC_CLIENT_EMAIL || !process.env.GOOGLE_SC_PRIVATE_KEY) return { status: "no-key" };
  try {
    const token = await googleToken();
    const siteUrl = process.env.GOOGLE_SC_SITE || `sc-domain:${new URL(SITE).host.replace(/^www\./, "")}`;
    const r = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inspectionUrl: postUrl(slug), siteUrl, languageCode: "ko" }),
      cache: "no-store",
    });
    const j = (await r.json()) as {
      inspectionResult?: { indexStatusResult?: { verdict?: string; coverageState?: string; lastCrawlTime?: string } };
      error?: { message?: string };
    };
    if (!r.ok) return { status: "error", message: j.error?.message ?? `구글 API ${r.status}` };
    const s = j.inspectionResult?.indexStatusResult;
    return {
      status: s?.verdict === "PASS" ? "indexed" : "not-indexed",
      coverage: s?.coverageState,
      lastCrawl: s?.lastCrawlTime ?? null,
    };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "오류" };
  }
}

/** 구글에서 이 글이 실제로 어떤 검색어로 노출·클릭됐는지 (최근 90일, Search Console 실적) */
export async function gscTopQueries(
  slug: string
): Promise<{ query: string; clicks: number; impressions: number; position: number }[] | null> {
  if (!process.env.GOOGLE_SC_CLIENT_EMAIL || !process.env.GOOGLE_SC_PRIVATE_KEY) return null;
  try {
    const token = await googleToken();
    const siteUrl = process.env.GOOGLE_SC_SITE || `sc-domain:${new URL(SITE).host.replace(/^www\./, "")}`;
    const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
    const r = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: day(90),
        endDate: day(0),
        dimensions: ["query"],
        dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "equals", expression: postUrl(slug) }] }],
        rowLimit: 10,
      }),
      cache: "no-store",
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { rows?: { keys: string[]; clicks: number; impressions: number; position: number }[] };
    return (j.rows ?? []).map((row) => ({
      query: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      position: Math.round(row.position * 10) / 10,
    }));
  } catch {
    return null;
  }
}

// ── IndexNow (네이버·Bing 등에 '새 글 있어요' 알림) ─────────
export function indexNowKey(): string {
  const fromEnv = process.env.INDEXNOW_KEY;
  if (fromEnv && /^[a-zA-Z0-9-]{8,128}$/.test(fromEnv)) return fromEnv;
  const seed = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "pothos-indexnow";
  return crypto.createHash("sha256").update(`indexnow:${seed}`).digest("hex").slice(0, 32);
}

export async function pingIndexNow(urls: string[]): Promise<{ engine: string; ok: boolean; status: number }[]> {
  if (urls.length === 0) return [];
  const host = new URL(SITE).host;
  const body = JSON.stringify({ host, key: indexNowKey(), keyLocation: `${SITE}/indexnow-key.txt`, urlList: urls.slice(0, 10000) });
  const engines = [
    ["네이버", "https://searchadvisor.naver.com/indexnow"],
    ["Bing 등", "https://api.indexnow.org/indexnow"],
  ];
  return Promise.all(
    engines.map(async ([engine, url]) => {
      try {
        const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body });
        return { engine, ok: r.status >= 200 && r.status < 300, status: r.status };
      } catch {
        return { engine, ok: false, status: 0 };
      }
    })
  );
}

export type PageRank = { position: number; query: string; impressions: number; clicks: number; isFocus: boolean };

/**
 * 글마다 구글 대표 순위 (최근 28일, Search Console 실적)
 * - 핵심 키워드로 노출된 기록이 있으면 그 순위
 * - 없으면 노출이 가장 많은 검색어의 순위
 * 반환: slug → 순위 (서치콘솔 미연결이면 null)
 */
export async function gscPageRanks(focusBySlug: Record<string, string>): Promise<Record<string, PageRank> | null> {
  if (!process.env.GOOGLE_SC_CLIENT_EMAIL || !process.env.GOOGLE_SC_PRIVATE_KEY) return null;
  try {
    const token = await googleToken();
    const siteUrl = process.env.GOOGLE_SC_SITE || `sc-domain:${new URL(SITE).host.replace(/^www\./, "")}`;
    const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
    const r = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: day(28),
        endDate: day(0),
        dimensions: ["page", "query"],
        dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/blog/" }] }],
        rowLimit: 5000,
      }),
      cache: "no-store",
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { rows?: { keys: string[]; clicks: number; impressions: number; position: number }[] };
    const compact = (s: string) => s.toLowerCase().replace(/\s+/g, "");
    const out: Record<string, PageRank> = {};
    for (const row of j.rows ?? []) {
      let slug = "";
      try {
        slug = decodeURIComponent(new URL(row.keys[0]).pathname).replace(/^\/blog\//, "").replace(/\/$/, "");
      } catch {
        continue;
      }
      if (!slug || slug.includes("/")) continue;
      const query = row.keys[1];
      const focus = focusBySlug[slug];
      const isFocus = !!focus && compact(query) === compact(focus);
      const cand: PageRank = { position: Math.round(row.position * 10) / 10, query, impressions: row.impressions, clicks: row.clicks, isFocus };
      const cur = out[slug];
      // 핵심 키워드 우선 → 그다음 노출 많은 검색어
      if (!cur || (cand.isFocus && !cur.isFocus) || (cand.isFocus === cur.isFocus && cand.impressions > cur.impressions)) out[slug] = cand;
    }
    return out;
  } catch {
    return null;
  }
}
