import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import StoryForm, { type StoryInitial } from "../../new/StoryForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "스토리 수정 - Pothos" };

export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/stories/${id}/edit`);

  const { data: story } = await getSupabaseServiceClient()
    .from("stories")
    .select("id, user_id, title, subtitle, destination, cover_image_url, intro, duration_text, tags, sections, is_deleted")
    .eq("id", id)
    .maybeSingle();
  if (!story || story.is_deleted) notFound();

  // 내가 쓴 스토리이거나 관리자만
  if (story.user_id !== session.user.id && !(await isAdmin(session.user.id))) redirect(`/stories/${id}`);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">스토리 수정</h1>
          <p className="text-slate-500 text-sm mb-8">사진·영상·링크를 추가하거나 내용을 고칠 수 있어요</p>
          <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-8">
            <StoryForm initial={story as StoryInitial} />
          </div>
        </div>
      </main>
    </div>
  );
}
