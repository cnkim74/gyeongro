// 어필리에이트 URL에서 OG 이미지·제목 자동 추출
//
// POST /api/admin/affiliate-products/fetch-image
//   body: { url: string }
//   응답: 200 { image_url, title?, price_text? }
//        400 (URL 없음 또는 형식 오류)
//        403 (admin 권한 없음)
//        502 (외부 fetch 실패)
//
// 동작:
//   1. 어필리에이트 URL 요청 (link.coupang.com/a/... 등)
//   2. 자동으로 리다이렉트 따라감 (Node fetch redirect: 'follow')
//   3. HTML 파싱 → <meta property="og:image"> 추출
//   4. 보너스: og:title, og:description 도 함께 추출

import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface FetchImageResult {
  image_url?: string;
  title?: string;
  description?: string;
  source_url?: string;
}

/** HTML에서 <meta> 또는 <link> 태그의 content/href 값 추출 */
function extractMeta(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return null;
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

  // 3. 외부 fetch — 봇 차단 회피용 User-Agent
  let html: string;
  let finalUrl: string;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        // 일반 모바일 브라우저 User-Agent (쿠팡은 모바일이 더 관대)
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return Response.json(
        {
          error: `외부 페이지 응답 오류 (${res.status}). 쿠팡이 봇을 차단했을 수 있어요. 수동으로 입력해주세요.`,
        },
        { status: 502 }
      );
    }
    html = await res.text();
    finalUrl = res.url;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch 실패";
    return Response.json(
      {
        error: `페이지 가져오기 실패: ${msg}. 수동으로 이미지 URL을 입력해주세요.`,
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
