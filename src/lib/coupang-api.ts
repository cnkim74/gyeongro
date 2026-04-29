// 쿠팡 파트너스 Open API 헬퍼
//
// HMAC-SHA256 서명 + DeepLink·Search 호출
// Docs: https://partners.coupang.com (개발자 가이드)
//
// 환경 변수:
//   COUPANG_ACCESS_KEY    Access Key (발급받은 UUID)
//   COUPANG_SECRET_KEY    Secret Key (발급받은 hex)
//
// Authorization 헤더 형식:
//   CEA algorithm=HmacSHA256, access-key={ACCESS}, signed-date={DATE}, signature={SIG}
//
// DATE 형식: yyMMddTHHmmssZ (UTC)
// MESSAGE: DATE + METHOD + URL_PATH + QUERY (queries는 path 일부 X)

import crypto from "node:crypto";

const HOST = "https://api-gateway.coupang.com";

export interface CoupangDeepLink {
  originalUrl: string;
  shortenUrl: string;
  landingUrl: string;
}

export interface CoupangProduct {
  productName: string;
  productPrice: number;
  productImage: string;
  productUrl: string;
  productId: number;
  isRocket: boolean;
  isFreeShipping: boolean;
  categoryName?: string;
}

/** UTC 시간을 yyMMddTHHmmssZ 형식으로 */
function formatDate(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    String(d.getUTCFullYear()).slice(-2) +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

/** Authorization 헤더 생성 */
function generateAuth(method: string, urlPath: string, query = ""): string {
  const accessKey = process.env.COUPANG_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY;
  if (!accessKey || !secretKey) {
    throw new Error("COUPANG_ACCESS_KEY/SECRET_KEY 환경변수가 설정되지 않았습니다.");
  }

  const date = formatDate();
  const message = date + method.toUpperCase() + urlPath + query;
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("hex");

  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${date}, signature=${signature}`;
}

/** 일반 호출 헬퍼 */
async function coupangFetch<T = unknown>(
  method: "GET" | "POST",
  path: string, // /v2/providers/...
  body?: unknown,
  query = ""
): Promise<T> {
  const url = HOST + path + (query ? `?${query}` : "");
  const auth = generateAuth(method, path, query ? `?${query}` : "");
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: auth,
      "Content-Type": "application/json;charset=UTF-8",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Coupang API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  return (await res.json()) as T;
}

/**
 * DeepLink 생성 — 일반 쿠팡 URL을 affiliate URL로 변환
 * @param urls 변환할 쿠팡 URL 배열 (최대 50개)
 * @returns 각 URL의 originalUrl / shortenUrl / landingUrl
 */
export async function generateDeepLinks(urls: string[]): Promise<CoupangDeepLink[]> {
  if (urls.length === 0) return [];
  const path = "/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink";
  type Resp = {
    rCode: string;
    rMessage: string;
    data: CoupangDeepLink[];
  };
  const result = await coupangFetch<Resp>("POST", path, { coupangUrls: urls });
  if (result.rCode !== "0") {
    throw new Error(`DeepLink 생성 실패: ${result.rMessage}`);
  }
  return result.data ?? [];
}

/** 단일 URL 변환 편의 함수 */
export async function generateDeepLink(url: string): Promise<CoupangDeepLink> {
  const arr = await generateDeepLinks([url]);
  if (arr.length === 0) throw new Error("DeepLink 결과 없음");
  return arr[0];
}

/**
 * 키워드로 상품 검색 — 이미지·가격·제목 모두 받음
 * @param keyword 검색어
 * @param limit 최대 결과 수 (기본 5)
 */
export async function searchProducts(
  keyword: string,
  limit = 5
): Promise<CoupangProduct[]> {
  const path =
    "/v2/providers/affiliate_open_api/apis/openapi/v1/products/search";
  const query = `keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
  type Resp = {
    rCode: string;
    rMessage: string;
    data: { productData: CoupangProduct[] };
  };
  const result = await coupangFetch<Resp>("GET", path, undefined, query);
  if (result.rCode !== "0") {
    throw new Error(`Search 실패: ${result.rMessage}`);
  }
  return result.data?.productData ?? [];
}

/** URL이 쿠팡 도메인인지 */
export function isCoupangUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return /(?:^|\.)coupang\.com$/i.test(u.hostname);
  } catch {
    return false;
  }
}
