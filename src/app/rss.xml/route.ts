// 블로그 RSS (/rss.xml) — 네이버 서치어드바이저·구독 앱이 새 글을 빨리 가져가도록
// 공개된 글 최신 50개

import { listPublishedPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

const SITE = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://pothostravel.com").replace(/\/$/, "");

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // XML에 쓸 수 없는 제어 문자 제거
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

function abs(u: string): string {
  return /^https?:\/\//.test(u) ? u : `${SITE}${u.startsWith("/") ? "" : "/"}${u}`;
}

export async function GET() {
  const posts = await listPublishedPosts(50);
  const items = posts
    .map((p) => {
      const url = `${SITE}/blog/${p.slug}`;
      const date = new Date(p.published_at ?? p.created_at).toUTCString();
      const img = p.cover_image_url ? `<p><img src="${esc(abs(p.cover_image_url))}" alt="${esc(p.title)}" /></p>` : "";
      const desc = `${img}<p>${esc(p.excerpt || p.title)}</p><p><a href="${url}">Pothos 블로그에서 전체 글 보기 →</a></p>`;
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${date}</pubDate>
${p.category ? `      <category>${esc(p.category)}</category>\n` : ""}      <description><![CDATA[${desc.replace(/]]>/g, "]]&gt;")}]]></description>
    </item>`;
    })
    .join("\n");

  const lastBuild = posts[0] ? new Date(posts[0].published_at ?? posts[0].created_at).toUTCString() : new Date().toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Pothos 여행 인사이트</title>
    <link>${SITE}/blog</link>
    <description>여행지 고르기부터 일정·예산·교통·축제까지, 떠나기 전에 알아두면 좋은 여행 정보</description>
    <language>ko</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
