import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserRole, ROLE_LABELS } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Megaphone, Plus, Eye, MousePointerClick, ArrowRight } from "lucide-react";
import SponsorshipActions from "./SponsorshipActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "스폰서 / 홍보 관리 - 경로",
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "검토 중", color: "bg-amber-100 text-amber-700" },
  approved: { label: "노출 중", color: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "반려", color: "bg-red-100 text-red-700" },
  expired: { label: "만료", color: "bg-gray-100 text-gray-500" },
};

export default async function SponsorPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/sponsor");

  const role = await getUserRole(session.user.id);
  if (role !== "business" && role !== "admin") {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-1 pt-24 pb-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              길잡이 전용 페이지입니다
            </h1>
            <p className="text-gray-500 mb-6">
              스폰서·홍보 메뉴는 <strong>길잡이(기업회원)</strong>만 사용할 수 있어요.
              <br />
              현재 권한: <strong>{ROLE_LABELS[role]}</strong>
            </p>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
            >
              프로필에서 권한 변경하기 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const supabase = getSupabaseServiceClient();
  const { data: sponsorships } = await supabase
    .from("sponsorships")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  const stats = {
    total: sponsorships?.length ?? 0,
    approved: sponsorships?.filter((s) => s.status === "approved").length ?? 0,
    views:
      sponsorships?.reduce((sum, s) => sum + (s.view_count ?? 0), 0) ?? 0,
    clicks:
      sponsorships?.reduce((sum, s) => sum + (s.click_count ?? 0), 0) ?? 0,
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Megaphone className="w-7 h-7 text-emerald-500" />
                스폰서 / 홍보 관리
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                여행자에게 노출할 광고·홍보 콘텐츠를 등록하고 성과를 확인하세요
              </p>
            </div>
            <Link
              href="/sponsor/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4" />새 홍보 등록
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "전체 광고", value: stats.total, color: "bg-gray-50 border-gray-200" },
              { label: "노출 중", value: stats.approved, color: "bg-emerald-50 border-emerald-200" },
              { label: "총 조회수", value: stats.views, color: "bg-blue-50 border-blue-200" },
              { label: "총 클릭수", value: stats.clicks, color: "bg-purple-50 border-purple-200" },
            ].map((s) => (
              <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
                <p className="text-xs text-gray-600 mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {s.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {!sponsorships || sponsorships.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
              <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                아직 등록한 홍보가 없어요
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                첫 광고를 등록하고 여행자들에게 노출해보세요
              </p>
              <Link
                href="/sponsor/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />첫 홍보 등록하기
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sponsorships.map((s) => {
                const status = STATUS_LABEL[s.status] ?? STATUS_LABEL.pending;
                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${status.color}`}
                          >
                            {status.label}
                          </span>
                          {s.category && (
                            <span className="text-xs text-gray-500">{s.category}</span>
                          )}
                          {s.destination && (
                            <span className="text-xs text-blue-500 font-medium">
                              📍 {s.destination}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-900 text-base line-clamp-1">
                          {s.title}
                        </h3>
                        {s.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {s.description}
                          </p>
                        )}
                      </div>
                      <SponsorshipActions sponsorshipId={s.id} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-50">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {(s.view_count ?? 0).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="w-3.5 h-3.5" />
                        {(s.click_count ?? 0).toLocaleString()}
                      </span>
                      <span className="text-gray-400 ml-auto">
                        {new Date(s.created_at).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
