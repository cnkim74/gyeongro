// 블로그·스토리 검색 노출 점검 (관리자 전용)
// GET ?id=<글 id>[&kind=story]  -> { naver, google, basics }
// POST { action: "indexnow", ids?: string[] } -> 수집 요청 결과 (ids 없으면 공개 글 전체)

import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { checkNaver, checkGoogle, pingIndexNow, postUrl, gscTopQueries, SITE } from "@/lib/search-index";
import { keywordChecks, relatedKeywordChecks } from "@/lib/blog-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  const sp = new URL(req.url).searchParams;
  const id = sp.get("id") ?? "";
  if (sp.get("kind") === "story") return storyCheck(id);
  const { data: p } = await getSupabaseServiceClient()
    .from("blog_posts")
    .select("*")
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

  const focus = String((p as { focus_keyword?: string | null }).focus_keyword ?? "").trim();
  const keyword = focus ? keywordChecks(focus, { title: p.title, excerpt: p.excerpt ?? "", content: String(p.content) }) : [];

  const related = relatedKeywordChecks(Array.isArray(p.tags) ? p.tags : [], focus, { content: String(p.content), excerpt: p.excerpt ?? "" });

  const [naver, google, queries] = await Promise.all([
    // 핵심 키워드가 있으면 그 검색어로 네이버 노출 확인 (없으면 제목으로)
    checkNaver(focus || p.title, p.slug),
    checkGoogle(p.slug),
    gscTopQueries(p.slug),
  ]);
  return Response.json({ url: postUrl(p.slug), naver, google, basics, focus, keyword, related, queries });
}

/** 스토리 점검 — 핵심 키워드 없이 기본 점검 + 네이버·구글 */
async function storyCheck(id: string) {
  const { data: st } = await getSupabaseServiceClient().from("stories").select("*").eq("id", id).maybeSingle();
  if (!st) return Response.json({ error: "스토리를 찾을 수 없어요." }, { status: 404 });
  const sections = (Array.isArray(st.sections) ? st.sections : []) as { title?: string; content?: string; image_url?: string }[];
  const text = [st.intro ?? "", ...sections.map((x) => String(x.content ?? ""))].join("\n");
  const photos = sections.filter((x) => x.image_url).length + (st.cover_image_url ? 1 : 0);
  const title = String(st.title ?? "");
  const intro = String(st.intro ?? "");
  const basics = [
    { ok: !!st.is_published && !st.is_deleted, label: "공개 상태", tip: "공개해야 검색엔진이 읽을 수 있어요" },
    { ok: title.length >= 10 && title.length <= 45, label: `제목 길이 ${title.length}자`, tip: "10~45자가 검색 결과에서 잘리지 않아요" },
    { ok: intro.length >= 40, label: `소개글 ${intro.length}자`, tip: "검색 결과 설명으로 쓰여요 (40자 이상)" },
    { ok: text.length >= 1000, label: `본문 ${text.length.toLocaleString()}자`, tip: "1,000자 이상이면 정보성 글로 평가받기 좋아요" },
    { ok: sections.length >= 3, label: `챕터 ${sections.length}개`, tip: "챕터 3개 이상" },
    { ok: !!st.cover_image_url, label: "대표 사진", tip: "공유·검색 미리보기 이미지" },
    { ok: photos >= 3, label: `사진 ${photos}장`, tip: "사진 3장 이상이면 이미지 검색에도 걸려요" },
  ];
  const path = `/stories/${id}`;
  const [naver, google, queries] = await Promise.all([checkNaver(title, path), checkGoogle(path), gscTopQueries(path)]);
  return Response.json({ url: `${SITE}${path}`, naver, google, basics, focus: "", keyword: [], related: [], queries });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  let body: { action?: string; ids?: string[]; kind?: string } = {};
  try {
    body = await req.json();
  } catch {
    // 빈 요청
  }
  if (body.action !== "indexnow") return Response.json({ error: "알 수 없는 요청" }, { status: 400 });
  if (body.kind === "story") {
    let sq = getSupabaseServiceClient().from("stories").select("id").eq("is_published", true).eq("is_deleted", false);
    if (Array.isArray(body.ids) && body.ids.length) sq = sq.in("id", body.ids.slice(0, 500));
    const { data: rows } = await sq;
    const surls = (rows ?? []).map((r) => `${SITE}/stories/${r.id}`);
    const sresults = await pingIndexNow([...surls, `${SITE}/stories`]);
    return Response.json({ count: surls.length, results: sresults });
  }
  let q = getSupabaseServiceClient().from("blog_posts").select("slug").eq("is_published", true);
  if (Array.isArray(body.ids) && body.ids.length) q = q.in("id", body.ids.slice(0, 500));
  const { data } = await q;
  const urls = (data ?? []).map((r) => postUrl(r.slug as string));
  const results = await pingIndexNow([...urls, `${postUrl("").replace(/\/$/, "")}`]);
  return Response.json({ count: urls.length, results });
}
