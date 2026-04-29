// 어필리에이트 URL에서 이미지·제목·가격 자동 추출
//
// POST /api/admin/affiliate-products/fetch-image
//   body: { url: string }
//   응답: 200 { image_url, title?, price_text?, affiliate_url? }
//        400 (URL 없음 또는 형식 오류)
//        403 (admin 권한 없음)
//        502 (외부 fetch 실패)
//
// 동작 우선순위:
//   1. 쿠팡 URL이면 → Coupang Partners API (DeepLink + Search) 사용
//      → 이미지 + 제목 + 가격 + 정식 affiliate URL 모두 받음
//   2. 그 외 → OG 메타태그 스크래핑 (Mobile Safari UA + JS 리다이렉트 추적)

import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import {
  isCoupangUrl,
  generateDeepLink,
  searchProducts,
} from "@/lib/coupang-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface FetchImageResult {
  image_url?: string;
  title?: string;
  description?: string;
  source_url?: string;
  affiliate_url?: string;
  price_text?: string;
}

/** HTML에서 <meta> 또는 <link> 태그의 content/href 값 추출 */
function extractMeta(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}

/** HTML에서 JS 리다이렉트(`location.href = '...'`) 또는 meta refresh URL 추출 */
function extractRedirectUrl(html: string, baseUrl: string): string | null {
  // 1) meta refresh: <meta http-equiv="refresh" content="0; url=https://...">
  const metaRefresh = html.match(
    /<meta\s+http-equiv=["']?refresh["']?\s+content=["'][^"']*url=([^"']+)["'][^>]*>/i
  );
  if (metaRefresh && metaRefresh[1]) {
    try {
      return new URL(metaRefresh[1].trim(), baseUrl).toString();
    } catch {
      /* ignore */
    }
  }

  // 2) JS: location.href = "..." / window.location = "..." / document.location = "..."
  const jsRedirect = html.match(
    /(?:window\.|document\.)?location(?:\.href)?\s*=\s*["']([^"']+)["']/i
  );
  if (jsRedirect && jsRedirect[1]) {
    try {
      return new URL(jsRedirect[1].trim(), baseUrl).toString();
    } catch {
      /* ignore */
    }
  }

  // 3) JS: location.replace("...")
  const jsReplace = html.match(
    /location\.replace\(\s*["']([^"']+)["']\s*\)/i
  );
  if (jsReplace && jsReplace[1]) {
    try {
      return new URL(jsReplace[1].trim(), baseUrl).toString();
    } catch {
      /* ignore */
    }
  }

  return null;
}

/** 2개 User-Agent 순서대로 시도 */
const USER_AGENTS = [
  // 1. Mobile Safari (가장 관대)
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  // 2. Desktop Chrome (다른 차단 회피)
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

async function fetchHtml(
  url: string,
  uaIndex = 0
): Promise<{ html: string; finalUrl: string } | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": USER_AGENTS[uaIndex] ?? USER_AGENTS[0],
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    return { html, finalUrl: res.url };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  // 1. 권한 확인 (admin만)
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  if (!(await isAdmin(session.user.id))) {
    return Response.json({ error: "관리자만 사용 가능해요." }, { status: 403 });
  }

  // 2. URL 파싱
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url) {
    return Response.json({ error: "URL을 입력해주세요." }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return Response.json({ error: "올바른 URL 형식이 아닙니다." }, { status: 400 });
  }

  if (!/^https?:$/.test(parsedUrl.protocol)) {
    return Response.json({ error: "http/https URL만 지원합니다." }, { status: 400 });
  }

  // 2.5 쿠팡 URL이면 Coupang Partners API 우선 사용 (정확도 100%)
  if (isCoupangUrl(url)) {
    try {
      // (a) DeepLink로 affiliate URL + landingUrl 받음
      const deepLink = await generateDeepLink(url);

      // (b) landingUrl HTML 스크래핑으로 og:image / og:title 추출 시도
      const fetched = await fetchHtml(deepLink.landingUrl);
      let imageUrl: string | null = null;
      let title: string | null = null;
      let priceText: string | null = null;

      if (fetched) {
        imageUrl = extractMeta(fetched.html, [
          /<meta\s+(?:property|name)=["']og:image(?::secure_url)?["']\s+content=["']([^"']+)["'][^>]*>/i,
          /<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image(?::secure_url)?["'][^>]*>/i,
          /<meta\s+(?:property|name)=["']twitter:image["']\s+content=["']([^"']+)["'][^>]*>/i,
        ]);
        title = extractMeta(fetched.html, [
          /<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["'][^>]*>/i,
          /<title>([^<]+)<\/title>/i,
        ]);
      }

      // (c) 스크래핑 실패하면 Search API로 키워드 검색 (제목 일부로)
      if ((!imageUrl || !title) && title) {
        try {
          // 제목 앞 5단어로 검색
          const keyword = title.split(/\s+/).slice(0, 5).join(" ");
          const products = await searchProducts(keyword, 3);
          if (products.length > 0) {
            const top = products[0];
            if (!imageUrl) imageUrl = top.productImage;
            if (!title) title = top.productName;
            priceText = `${top.productPrice.toLocaleString("ko-KR")}원`;
          }
        } catch {
          /* search 실패해도 deeplink는 줌 */
        }
      }

      return Response.json({
        image_url: imageUrl ?? undefined,
        title: title
          ? title.replace(/\s*\|\s*쿠팡!?\s*$/i, "").trim()
          : undefined,
        price_text: priceText ?? undefined,
        affiliate_url: deepLink.shortenUrl, // 정식 affiliate 단축 URL
        source_url: deepLink.landingUrl,
      });
    } catch (err) {
      // Coupang API 실패 → OG 스크래핑으로 fallback (아래 로직 진행)
      console.warn(
        "[fetch-image] Coupang API 실패, OG 스크래핑 fallback:",
        err instanceof Error ? err.message : err
      );
    }
  }

  // 3. 다단계 fetch — 최대 3회 (원본 → JS 리다이렉트 → 한 번 더)
  let html = "";
  let finalUrl = url;
  let currentUrl = url;
  let success = false;

  for (let uaIdx = 0; uaIdx < USER_AGENTS.length && !success; uaIdx++) {
    currentUrl = url;
    for (let hop = 0; hop < 3; hop++) {
      const result = await fetchHtml(currentUrl, uaIdx);
      if (!result) break;
      html = result.html;
      finalUrl = result.finalUrl;

      // og:image가 있으면 성공
      if (
        /og:image/i.test(html) ||
        /twitter:image/i.test(html) ||
        /image_src/i.test(html)
      ) {
        success = true;
        break;
      }

      // og 없음 → JS/meta 리다이렉트가 있는지 시도
      const redirectUrl = extractRedirectUrl(html, finalUrl);
      if (!redirectUrl || redirectUrl === currentUrl) break;
      currentUrl = redirectUrl;
    }
  }

  if (!html) {
    return Response.json(
      {
        error:
          "페이지를 가져오지 못했어요. 쿠팡이 차단했거나 네트워크 문제일 수 있습니다. 수동으로 이미지 URL을 입력해주세요.",
      },
      { status: 502 }
    );
  }

  // 4. og:image / twitter:image / link image_src 등 다양한 패턴 시도
  const imageUrl = extractMeta(html, [
    /<meta\s+(?:property|name)=["']og:image(?::secure_url)?["']\s+content=["']([^"']+)["'][^>]*>/i,
    /<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image(?::secure_url)?["'][^>]*>/i,
    /<meta\s+(?:property|name)=["']twitter:image["']\s+content=["']([^"']+)["'][^>]*>/i,
    /<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']twitter:image["'][^>]*>/i,
    /<link\s+rel=["']image_src["']\s+href=["']([^"']+)["'][^>]*>/i,
  ]);

  const title = extractMeta(html, [
    /<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["'][^>]*>/i,
    /<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:title["'][^>]*>/i,
    /<title>([^<]+)<\/title>/i,
  ]);

  const description = extractMeta(html, [
    /<meta\s+(?:property|name)=["']og:description["']\s+content=["']([^"']+)["'][^>]*>/i,
    /<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:description["'][^>]*>/i,
    /<meta\s+name=["']description["']\s+content=["']([^"']+)["'][^>]*>/i,
  ]);

  if (!imageUrl) {
    return Response.json(
      {
        error:
          "이미지를 자동으로 찾지 못했어요. 쿠팡이 봇을 차단했거나 메타 태그가 없는 페이지일 수 있어요. 수동으로 입력해주세요.",
        title,
        description,
        source_url: finalUrl,
      },
      { status: 404 }
    );
  }

  // 상대 경로면 절대 경로로 변환
  let absoluteImageUrl = imageUrl;
  try {
    absoluteImageUrl = new URL(imageUrl, finalUrl).toString();
  } catch {
    // 이미 절대 경로면 그대로
  }

  const result: FetchImageResult = {
    image_url: absoluteImageUrl,
    title: title ? title.replace(/\s*\|\s*쿠팡!?\s*$/i, "").trim() : undefined,
    description: description?.trim(),
    source_url: finalUrl,
  };

  return Response.json(result);
}
