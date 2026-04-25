import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import ReviewForm from "../ReviewForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "후기 작성 - 경로",
};

export default async function NewReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/reviews/new");

  // 사용자의 저장된 여행 계획 (선택해서 후기에 연결할 수 있음)
  const supabase = getSupabaseServiceClient();
  const { data: trips } = await supabase
    .from("travel_plans")
    .select("id, title, destination")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">후기 작성</h1>
          <p className="text-gray-500 text-sm mb-6">
            다녀온 여행의 별점과 경험을 공유해주세요
          </p>
          <div className="bg-white rounded-3xl border border-gray-100 p-8">
            <ReviewForm trips={trips ?? []} />
          </div>
        </div>
      </main>
    </div>
  );
}
