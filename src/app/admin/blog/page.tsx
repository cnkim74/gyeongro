import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { formatBlogDate } from "@/lib/blog-utils";
import { PenSquare, Eye, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "블로그 관리 - Pothos" };

type Row = { id: string; slug: string; title: string; category: string; is_published: boolean; published_at: string | null; updated_at: string; view_count: number };

export default async function AdminBlogPage() {
  await requireAdmin();
  let rows: Row[] = [];
  let missing = false;
  try {
    const { data, error } = await getSupabaseServiceClient()
      .from("blog_posts")
      .select("id, slug, title, category, is_published, published_at, updated_at, view_count")
      .order("updated_at", { ascending: false })
      .limit(300);
    if (error) missing = true;
    rows = (data ?? []) as Row[];
  } catch {
    missing = true;
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">블로그 관리</h1>
          <p className="text-sm text-gray-500 mt-1">여행 인사이트 글을 쓰고 공개해요. 공개한 글은 /blog 에 바로 보여요.</p>
        </div>
        <Link href="/admin/blog/new" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold">
          <PenSquare className="w-4 h-4" /> 새 글 쓰기
        </Link>
      </div>

      {missing && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>
            블로그 표가 아직 없어요. Supabase SQL Editor에서 <code className="px-1 bg-white rounded">supabase/migration_blog.sql</code> 을 한 번
            실행해 주세요.
          </p>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">아직 쓴 글이 없어요.</div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  r.is_published ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {r.is_published ? "공개" : "임시저장"}
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/blog/${r.id}`} className="block font-semibold text-gray-900 truncate hover:text-blue-600">
                  {r.title}
                </Link>
                <p className="text-xs text-gray-400 truncate">
                  {r.category && `#${r.category} · `}
                  {r.is_published ? `공개 ${formatBlogDate(r.published_at)}` : `수정 ${formatBlogDate(r.updated_at)}`} · 조회 {r.view_count} · /blog/{r.slug}
                </p>
              </div>
              <Link href={`/blog/${r.slug}`} target="_blank" className="shrink-0 p-2 text-gray-400 hover:text-gray-700" title="글 보기">
                <Eye className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
