// 블로그 검색 노출 점검 (관리자 전용)
// GET ?id=<글 id>  -> { naver, google, basics }
// POST { action: "indexnow", ids?: string[] } -> 수집 요청 결과 (ids 없으면 공개 글 전체)

import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { checkNaver, checkGoogle, pingIndexNow, postUrl } from "@/lib/search-index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const { data: p } = await getSupabaseServiceClient()
    .from("blog_posts")
    .select("slug, title, excerpt, cover_image_url, content, faq, is_published")
    .eq("id", id)
    .maybeSingle();
  if (!p) return Response.json({ error: "글을 찾을 수 없어요." }, { status: 404 });

  // 기본 점검 (검색에 잘 걸리는 글인지)
  const h2 = (String(p.content).match(/^##\s/gm) ?? []).length;
  const basics = [
    { ok: p.is_published, label: "공개 상태", tip: "공개해야 검색엔진이 읽을 수 있어요" },
    { ok: p.title.length >= 10 && p.title.length <= 40, label: `제목 길이 ${p.title.length}자`, tip: "10~40자가 검색 결과에서 잘리지 않아요" },
    { ok: (p.excerpt ?? "").length >= 40, label: `요약 ${String(p.excerpt ?? "").length}자`, tip: "검색 결과 설명으로 쓰여요 (40~120자 권장)" },
    { ok: String(p.content).length >= 1500, label: `본문 ${String(p.content).length.toLocaleString()}자`, tip: "1,500자 이상이면 정보성 글로 평가받기 좋아요" },
    { ok: h2 >= 3, label: `소제목 ${h2}개`, tip: "## 소제목 3개 이상" },
    { ok: Array.isArray(p.faq) && p.faq.length > 0, label: "자주 묻는 질문", tip: "구글 검색 결과에 질문·답이 붙을 수 있어요" },
    { ok: !!p.cover_image_url, label: "대표 사진", tip: "공유·검색 미리보기 이미지" },
  ];

  const [naver, google] = await Promise.all([checkNaver(p.title, p.slug), checkGoogle(p.slug)]);
  return Response.json({ url: postUrl(p.slug), naver, google, basics });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  let body: { action?: string; ids?: string[] } = {};
  try {
    body = await req.json();
  } catch {
    // 빈 요청
  }
  if (body.action !== "indexnow") return Response.json({ error: "알 수 없는 요청" }, { status: 400 });
  let q = getSupabaseServiceClient().from("blog_posts").select("slug").eq("is_published", true);
  if (Array.isArray(body.ids) && body.ids.length) q = q.in("id", body.ids.slice(0, 500));
  const { data } = await q;
  const urls = (data ?? []).map((r) => postUrl(r.slug as string));
  const results = await pingIndexNow([...urls, `${postUrl("").replace(/\/$/, "")}`]);
  return Response.json({ count: urls.length, results });
}
