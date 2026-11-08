// 블로그 목록용 순위 뱃지 데이터 (관리자)
// GET  -> { google: { [slug]: PageRank } | null, naver: { [postId]: NaverRank } }
// POST { postId, rank: number | null, keyword } -> 네이버 순위 직접 기록
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { gscPageRanks } from "@/lib/search-index";
import { getNaverRanks, setNaverRank } from "@/lib/naver-ranks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  const { data } = await getSupabaseServiceClient().from("blog_posts").select("*").eq("is_published", true).limit(500);
  const focusBySlug: Record<string, string> = {};
  for (const p of (data ?? []) as { slug: string; focus_keyword?: string | null }[]) {
    if (p.focus_keyword) focusBySlug[p.slug] = p.focus_keyword;
  }
  const [google, naver] = await Promise.all([gscPageRanks(focusBySlug), getNaverRanks()]);
  return Response.json({ google, naver });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return Response.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { postId?: string; rank?: number | null; keyword?: string };
  const postId = String(body.postId ?? "");
  if (!postId) return Response.json({ error: "글이 필요해요." }, { status: 400 });
  let rank: number | null = null;
  if (body.rank !== null && body.rank !== undefined) {
    const n = Math.round(Number(body.rank));
    if (!Number.isFinite(n) || n < 0 || n > 1000) return Response.json({ error: "순위는 1~1000 사이 숫자로 (안 보이면 0)" }, { status: 400 });
    rank = n;
  }
  try {
    const naver = await setNaverRank(postId, rank, String(body.keyword ?? ""));
    return Response.json({ naver });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "저장 실패" }, { status: 500 });
  }
}
