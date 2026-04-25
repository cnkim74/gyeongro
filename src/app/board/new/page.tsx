import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Header from "@/components/Header";
import PostForm from "../PostForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "글쓰기 - 경로",
};

export default async function NewPostPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/board/new");

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">글쓰기</h1>
          <div className="bg-white rounded-3xl border border-gray-100 p-8">
            <PostForm />
          </div>
        </div>
      </main>
    </div>
  );
}
