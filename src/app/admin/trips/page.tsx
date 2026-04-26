import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { MapPin, Calendar, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "여행 계획 관리 - Pothos",
};

export default async function AdminTripsPage() {
  await requireAdmin();

  const supabase = getSupabaseServiceClient();
  const { data: trips } = await supabase
    .from("travel_plans")
    .select("id, title, destination, days, people, budget, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(100);

  const userIds = [...new Set((trips ?? []).map((t) => t.user_id))];
  const usersMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id, name, email")
      .in("id", userIds);
    for (const u of users ?? []) {
      usersMap[u.id] = u.name ?? u.email ?? "익명";
    }
  }

  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">여행 계획 관리</h1>
      <p className="text-sm text-gray-500 mb-6">
        전체 {trips?.length ?? 0}개 (최근 100개)
      </p>

      {!trips || trips.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">아직 저장된 여행 계획이 없어요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trips.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="inline-flex items-center gap-1 text-xs text-blue-500 font-medium bg-blue-50 px-2.5 py-1 rounded-full">
                  <MapPin className="w-3 h-3" />
                  {t.destination}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(t.created_at).toLocaleDateString("ko-KR")}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{t.title}</h3>
              <p className="text-xs text-gray-500 mb-3">
                by {usersMap[t.user_id] ?? "알 수 없음"}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {t.days}박 {t.days + 1}일
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {t.people}명
                </span>
                <span className="text-emerald-600 font-semibold">
                  {t.budget.toLocaleString()}원
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
