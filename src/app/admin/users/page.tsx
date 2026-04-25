import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import { ArrowLeft, Shield } from "lucide-react";
import AdminToggle from "./AdminToggle";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "사용자 관리 - 경로",
};

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  if (!session) redirect("/");

  const supabase = getSupabaseServiceClient();
  const { data: users } = await supabase
    .schema("next_auth")
    .from("users")
    .select("id, name, email, image, custom_image, phone");

  const { data: admins } = await supabase.from("admins").select("user_id");
  const adminSet = new Set((admins ?? []).map((a) => a.user_id));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            대시보드로
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">사용자 관리</h1>
          <p className="text-gray-500 text-sm mb-6">
            전체 가입자 {users?.length ?? 0}명
          </p>

          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">사용자</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">이메일</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">전화번호</th>
                    <th className="text-center px-5 py-3 font-semibold text-gray-600">관리자</th>
                  </tr>
                </thead>
                <tbody>
                  {(users ?? []).map((u) => {
                    const img = u.custom_image ?? u.image;
                    const isCurrentUser = u.id === session.user.id;
                    return (
                      <tr
                        key={u.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={img}
                                alt={u.name ?? ""}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                {(u.name ?? u.email ?? "U").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-gray-900">
                                {u.name ?? "이름 없음"}
                              </span>
                              {adminSet.has(u.id) && (
                                <Shield className="w-3.5 h-3.5 text-purple-500" />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-600">{u.email ?? "-"}</td>
                        <td className="px-5 py-3 text-gray-600">{u.phone ?? "-"}</td>
                        <td className="px-5 py-3 text-center">
                          <AdminToggle
                            userId={u.id}
                            isAdmin={adminSet.has(u.id)}
                            disabled={isCurrentUser}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
