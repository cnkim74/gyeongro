import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Header from "@/components/Header";
import StoryForm from "./StoryForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "스토리 작성 - Pothos",
};

export default async function NewStoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/stories/new");

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            나만의 여행 스토리
          </h1>
          <p className="text-slate-500 text-sm mb-8">
            여행에서 느낀 것, 발견한 것, 기억하고 싶은 것을 자유롭게 기록해보세요
          </p>
          <div className="bg-white rounded-3xl border border-slate-100 p-8">
            <StoryForm />
          </div>
        </div>
      </main>
    </div>
  );
}
