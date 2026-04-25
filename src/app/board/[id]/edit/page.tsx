import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";
import Header from "@/components/Header";
import PostForm from "../../PostForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "글 수정 - 경로",
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) redirect(`/login?callbackUrl=/board/${id}/edit`);

  const supabase = getSupabaseServiceClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id, title, content, category, user_id, is_deleted")
    .eq("id", id)
    .single();

  if (!post || post.is_deleted) notFound();

  const admin = await isAdmin(session.user.id);
  if (post.user_id !== session.user.id && !admin) {
    redirect(`/board/${id}`);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">글 수정</h1>
          <div className="bg-white rounded-3xl border border-gray-100 p-8">
            <PostForm
              postId={post.id}
              initialTitle={post.title}
              initialContent={post.content}
              initialCategory={post.category}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
