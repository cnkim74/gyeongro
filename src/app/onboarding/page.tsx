import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import OnboardingForm from "./OnboardingForm";
import { MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "환영합니다 - 경로",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const supabase = getSupabaseServiceClient();
  const { data: user } = await supabase
    .schema("next_auth")
    .from("users")
    .select("phone, name")
    .eq("id", session.user.id)
    .single();

  const { callbackUrl } = await searchParams;
  const target = callbackUrl || "/";

  if (user?.phone) redirect(target);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {user?.name ? `${user.name}님, 환영해요!` : "환영해요!"}
            </h1>
            <p className="text-gray-500 text-sm">
              회원 유형을 선택하고 휴대전화 번호를 입력해주세요
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <OnboardingForm callbackUrl={target} />
          </div>

          <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
            휴대전화 번호는 여행 일정 알림 등 중요한 안내에 사용됩니다.
            <br />
            제3자에게 제공되지 않으며, 마케팅 SMS는 발송하지 않아요.
          </p>
        </div>
      </main>
    </div>
  );
}
