import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, Mountain } from "lucide-react";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import ApplyForm from "./ApplyForm";

export const metadata = {
  title: "셰르파 신청 - Pothos",
  description:
    "현지를 잘 아는 사람이라면, 누구나 셰르파가 될 수 있어요. 신청 후 검증을 거쳐 활동 시작.",
};

export const dynamic = "force-dynamic";

export default async function BecomeSherpaPage() {
  const session = await auth();
  let prefilledName: string | null = null;
  let alreadyApplied = false;

  if (session?.user?.id) {
    const supabase = getSupabaseServiceClient();
    const { data: user } = await supabase
      .schema("next_auth")
      .from("users")
      .select("nickname, name")
      .eq("id", session.user.id)
      .maybeSingle();
    prefilledName = user?.nickname ?? user?.name ?? null;

    const { data: existing } = await supabase
      .from("sherpas")
      .select("status, slug")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (existing) alreadyApplied = true;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-6">
          <Link
            href="/sherpa"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> 셰르파 목록
          </Link>

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white mb-4">
              <Mountain className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              셰르파 신청
            </h1>
            <p className="text-slate-500 leading-relaxed">
              여행자가 만든 일정에 합류하거나, 본인의 서비스를 등록해 매칭을
              받으세요.
              <br />
              결제는 추후 안전결제 도입 예정이며 현재는 셰르파-여행자 직접 협의입니다.
            </p>
          </div>

          {alreadyApplied ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
              <p className="text-emerald-900 font-bold mb-2">
                이미 셰르파로 등록되어 있어요
              </p>
              <p className="text-sm text-emerald-700">
                기존 프로필을 수정하시려면 셰르파 대시보드에서 진행하세요. (곧 추가됩니다)
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-7">
              <ApplyForm
                prefilledName={prefilledName}
                isLoggedIn={!!session?.user?.id}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
