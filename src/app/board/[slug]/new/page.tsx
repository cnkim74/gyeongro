import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import PostForm from "@/app/board/PostForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "글쓰기 - Pothos",
};

export default async function NewPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/board/${slug}/new`);

  const supabase = getSupabaseServiceClient();
  const { data: board } = await supabase
    .from("boards")
    .select("id, slug, name, icon, is_admin_only, is_published")
    .eq("slug", slug)
    .single();

  if (!board || !board.is_published) notFound();

  if (board.is_admin_only) {
    const adminFlag = await isAdmin(session.user.id);
    if (!adminFlag) redirect(`/board/${slug}`);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <span className="text-3xl mr-2">{board.icon ?? "📋"}</span>
            {board.name} - 글쓰기
          </h1>
          <p className="text-gray-500 text-sm mb-6">새 글을 작성합니다</p>
          <div className="bg-white rounded-3xl border border-gray-100 p-8">
            <PostForm boardId={board.id} boardSlug={board.slug} />
          </div>
        </div>
      </main>
    </div>
  );
}
