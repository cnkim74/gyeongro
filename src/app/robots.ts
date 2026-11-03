// 검색엔진 수집 규칙 (/robots.txt) — 관리자·API 제외, 사이트맵 안내

import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://pothostravel.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/indexnow-key.txt"], disallow: ["/admin", "/api/", "/my-trips", "/profile"] }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
