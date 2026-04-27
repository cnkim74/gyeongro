import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RoleBadge from "@/components/RoleBadge";
import ProfileForm from "./ProfileForm";
import { resolveUserImage } from "@/lib/avatars";
import { parseRole, ROLE_DESCRIPTIONS } from "@/lib/admin";
import { Mountain, Building2, Shield, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "프로필 - Pothos",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/profile");

  const supabase = getSupabaseServiceClient();
  const { data: user } = await supabase
    .schema("next_auth")
    .from("users")
    .select(
      "id, name, email, image, custom_image, phone, nickname, avatar_preset, role, business_name"
    )
    .eq("id", session.user.id)
    .single();

  const role = parseRole(user?.role);

  // 셰르파 신청 현황 (있으면)
  let sherpaStatus: string | null = null;
  if (role === "sherpa" || (user?.role as string) === "sherpa") {
    const { data: sherpaRow } = await supabase
      .from("sherpas")
      .select("status")
      .eq("user_id", session.user.id)
      .maybeSingle();
    sherpaStatus = sherpaRow?.status ?? null;
  }

  const displayImage = resolveUserImage({
    custom_image: user?.custom_image,
    avatar_preset: user?.avatar_preset,
    image: user?.image,
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">프로필</h1>
          <p className="text-gray-500 text-sm mb-8">
            프로필 사진과 정보를 관리하세요
          </p>

          {/* 내 역할 */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900">내 역할</p>
              <RoleBadge role={role} size="md" showTraveler />
            </div>
            <p className="text-xs text-gray-500 mb-4">
              {ROLE_DESCRIPTIONS[role]}
            </p>

            {role === "user" && (
              <Link
                href="/sherpa/become"
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
              >
                <Mountain className="w-3.5 h-3.5" />
                셰르파로 활동하고 싶다면
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}

            {role === "sherpa" && (
              <div className="space-y-2">
                {sherpaStatus === "published" ? (
                  <Link
                    href="/sherpa/dashboard"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
                  >
                    <Mountain className="w-3.5 h-3.5" />
                    셰르파 대시보드로 이동
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                ) : sherpaStatus === "pending" ? (
                  <p className="text-xs text-amber-700">
                    🕒 셰르파 신청 검수 중입니다. 운영팀 승인 후 활동 가능해요.
                  </p>
                ) : sherpaStatus === "rejected" ? (
                  <p className="text-xs text-red-600">
                    ⚠️ 셰르파 신청이 거절됐습니다.{" "}
                    <Link
                      href="/sherpa/become"
                      className="underline font-semibold"
                    >
                      다시 신청
                    </Link>
                  </p>
                ) : (
                  <Link
                    href="/sherpa/become"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
                  >
                    <Mountain className="w-3.5 h-3.5" />
                    셰르파 프로필 작성하기
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            )}

            {role === "business" && (
              <div className="space-y-1.5">
                {user?.business_name && (
                  <p className="text-xs text-gray-700">
                    <span className="font-semibold">사업체:</span>{" "}
                    {user.business_name}
                  </p>
                )}
                <Link
                  href="/sponsor"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  스폰서 / 홍보 관리
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {role === "admin" && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-800"
              >
                <Shield className="w-3.5 h-3.5" />
                관리자 콘솔
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}

          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-8">
            <ProfileForm
              userId={session.user.id}
              name={user?.name ?? null}
              email={user?.email ?? null}
              phone={user?.phone ?? null}
              nickname={user?.nickname ?? null}
              avatarPreset={user?.avatar_preset ?? null}
              currentImage={displayImage}
              hasCustomImage={!!user?.custom_image}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
