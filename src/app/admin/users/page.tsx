import { requireAdmin, ROLE_LABELS, ROLE_COLORS, type UserRole } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import RoleSelect from "./RoleSelect";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "사용자 관리 - 경로",
};

export default async function AdminUsersPage() {
  const session = await requireAdmin();

  const supabase = getSupabaseServiceClient();
  let users: Array<{
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    custom_image: string | null;
    phone: string | null;
    role: UserRole;
  }> = [];

  // role 컬럼이 있는지 확인하며 조회
  const result = await supabase
    .schema("next_auth")
    .from("users")
    .select("id, name, email, image, custom_image, phone, role");

  if (result.error) {
    // role 컬럼이 없을 수 있음 → 폴백: admins 테이블 활용
    const { data: usersFallback } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id, name, email, image, custom_image, phone");
    const { data: admins } = await supabase.from("admins").select("user_id");
    const adminSet = new Set((admins ?? []).map((a) => a.user_id));
    users = (usersFallback ?? []).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      custom_image: u.custom_image,
      phone: u.phone,
      role: (adminSet.has(u.id) ? "admin" : "user") as UserRole,
    }));
  } else {
    users = (result.data ?? []) as typeof users;
  }

  const counts = {
    total: users.length,
    user: users.filter((u) => u.role === "user").length,
    business: users.filter((u) => u.role === "business").length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">사용자 관리</h1>
      <p className="text-sm text-gray-500 mb-6">
        가입자 권한 등급을 일반 / 기업회원 / 관리자로 구분하여 관리할 수 있어요.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "전체", value: counts.total, color: "bg-gray-50 border-gray-200" },
          { label: "일반", value: counts.user, color: "bg-blue-50 border-blue-200" },
          { label: "기업회원", value: counts.business, color: "bg-emerald-50 border-emerald-200" },
          { label: "관리자", value: counts.admin, color: "bg-purple-50 border-purple-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-xs text-gray-600 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">사용자</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">이메일</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">전화번호</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">현재 권한</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">권한 변경</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const img = u.custom_image ?? u.image;
                const isCurrentUser = u.id === session?.user?.id;
                return (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt={u.name ?? ""} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                            {(u.name ?? u.email ?? "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{u.name ?? "이름 없음"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{u.email ?? "-"}</td>
                    <td className="px-5 py-3 text-gray-600">{u.phone ?? "-"}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role]}`}
                      >
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <RoleSelect
                        userId={u.id}
                        currentRole={u.role}
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
  );
}
