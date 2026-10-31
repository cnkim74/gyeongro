// 네이버 블로그 후기 검색 (국내 장소용)
//
// GET ?q=<장소명 + 도시>  -> { items: [{ title, link, description, blogger, date }] }
// 환경변수: NAVER_SEARCH_CLIENT_ID, NAVER_SEARCH_CLIENT_SECRET (네이버 개발자센터 '검색' API)
// 키가 없으면 빈 목록 반환 (화면에서 섹션을 숨김)

import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function stripTags(s: string): string {
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const id = process.env.NAVER_SEARCH_CLIENT_ID;
  const secret = process.env.NAVER_SEARCH_CLIENT_SECRET;
  if (!id || !secret) return Response.json({ items: [], enabled: false });

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (!q) return Response.json({ items: [], enabled: true });

  const res = await fetch(
    `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(q)}&display=3&sort=sim`,
    {
      headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret },
      cache: "no-store",
    }
  );
  if (!res.ok) return Response.json({ items: [], enabled: true });

  const data = (await res.json()) as {
    items?: { title: string; link: string; description: string; bloggername: string; postdate: string }[];
  };
  const items = (data.items ?? []).map((it) => ({
    title: stripTags(it.title),
    link: it.link,
    description: stripTags(it.description),
    blogger: it.bloggername,
    // "20260315" → "2026.03.15"
    date: /^\d{8}$/.test(it.postdate)
      ? `${it.postdate.slice(0, 4)}.${it.postdate.slice(4, 6)}.${it.postdate.slice(6, 8)}`
      : "",
  }));
  return Response.json(
    { items, enabled: true },
    { headers: { "Cache-Control": "private, max-age=3600" } }
  );
}
