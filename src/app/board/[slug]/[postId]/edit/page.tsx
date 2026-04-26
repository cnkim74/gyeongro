import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";
import Header from "@/components/Header";
import PostForm from "@/app/board/PostForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "글 수정 - 경로",
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const session = await auth();
  const { slug, postId } = await params;
  if (!session?.user?.id) redirect(`/login?callbackUrl=/board/${slug}/${postId}/edit`);

  const supabase = getSupabaseServiceClient();
  const { data: board } = await supabase
    .from("boards")
    .select("id, slug, name, icon")
    .eq("slug", slug)
    .single();
  if (!board) notFound();

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, content, board_id, user_id, is_deleted")
    .eq("id", postId)
    .single();

  if (!post || post.is_deleted) notFound();
  if (post.board_id !== board.id) notFound();

  const admin = await isAdmin(session.user.id);
  if (post.user_id !== session.user.id && !admin) {
    redirect(`/board/${slug}/${postId}`);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            <span className="text-3xl mr-2">{board.icon ?? "📋"}</span>
            글 수정
          </h1>
          <div className="bg-white rounded-3xl border border-gray-100 p-8">
            <PostForm
              boardId={board.id}
              boardSlug={board.slug}
              postId={post.id}
              initialTitle={post.title}
              initialContent={post.content}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
