import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, Building2, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import ClinicApplyForm from "./ClinicApplyForm";

export const metadata = {
  title: "클리닉 등록 신청 - Pothos 의료관광",
};

export const dynamic = "force-dynamic";

export default async function ClinicRegisterPage() {
  const session = await auth();
  const supabase = getSupabaseServiceClient();

  const { data: procedures } = await supabase
    .from("medical_procedures")
    .select("slug, name_ko, emoji")
    .order("display_order");

  let prefilledEmail: string | null = null;
  if (session?.user?.id) {
    const { data: user } = await supabase
      .schema("next_auth")
      .from("users")
      .select("email")
      .eq("id", session.user.id)
      .maybeSingle();
    prefilledEmail = user?.email ?? null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-6">
          <Link
            href="/medical"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> 의료관광 홈
          </Link>

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white mb-4">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              병원/클리닉 등록 신청
            </h1>
            <p className="text-slate-500 leading-relaxed">
              의료기관을 운영하시는 분이라면 Pothos에 정보를 등록하실 수 있습니다.
              <br />
              관리자 검수 후 게시되며, 평균 2~3 영업일 소요됩니다.
            </p>
          </div>

          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-sm text-rose-900 leading-relaxed">
              <p className="font-semibold mb-1">검수 기준</p>
              <ul className="text-xs text-rose-700 space-y-0.5">
                <li>· 정식 의료기관 (사업자등록증·의료기관 개설 신고증)</li>
                <li>· 외국인환자 유치업 등록 (인바운드 시 권장)</li>
                <li>· 의료법 제27조 (영리 알선·유인 금지) 준수 가능 여부</li>
                <li>· 광고법상 의료광고 사전심의 적용 영역은 별도 표기</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-7">
            <ClinicApplyForm
              procedures={procedures ?? []}
              isLoggedIn={!!session?.user?.id}
              prefilledEmail={prefilledEmail}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
