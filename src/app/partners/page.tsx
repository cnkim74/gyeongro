import Link from "next/link";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RoleBadge from "@/components/RoleBadge";
import {
  Users,
  Plus,
  MapPin,
  Calendar,
  ArrowRight,
} from "lucide-react";
import type { UserRole } from "@/lib/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "여행 동료 찾기 - 경로",
};

interface PartnerRow {
  id: string;
  title: string;
  description: string | null;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  max_people: number;
  current_people: number;
  status: string;
  created_at: string;
  user_id: string;
}

function formatDate(d: string | null): string {
  if (!d) return "";
  const date = new Date(d);
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

export default async function PartnersPage() {
  const supabase = getSupabaseServiceClient();
  const { data: posts } = await supabase
    .from("partner_posts")
    .select(
      "id, title, description, destination, start_date, end_date, max_people, current_people, status, created_at, user_id"
    )
    .eq("is_deleted", false)
    .order("status")
    .order("created_at", { ascending: false })
    .limit(50);

  const userIds = [...new Set((posts ?? []).map((p) => p.user_id))];
  const usersMap: Record<
    string,
    { name: string | null; image: string | null; role: UserRole }
  > = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id, name, image, custom_image, role")
      .in("id", userIds);
    for (const u of users ?? []) {
      const role: UserRole =
        u.role === "admin" || u.role === "business" || u.role === "user"
          ? u.role
          : "user";
      usersMap[u.id] = {
        name: u.name,
        image: u.custom_image ?? u.image,
        role,
      };
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-semibold text-blue-600 mb-2 tracking-wide">
                FIND TRAVEL PARTNERS
              </p>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
                같이 떠날 동료를 찾아보세요
              </h1>
              <p className="text-slate-500">
                혼자보단 둘, 둘보단 셋. 같은 길을 향하는 사람과 만나세요.
              </p>
            </div>
            <Link
              href="/partners/new"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              동료 모집하기
            </Link>
          </div>

          {!posts || posts.length === 0 ? (
            <div className="bg-slate-50 rounded-3xl p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                아직 모집이 없어요
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                첫 모집을 시작해보세요. 같은 곳을 향하는 동료가 기다리고 있어요.
              </p>
              <Link
                href="/partners/new"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-4 h-4" />첫 모집 등록
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(posts as PartnerRow[]).map((p) => {
                const author = usersMap[p.user_id];
                const closed = p.status !== "open";
                return (
                  <Link
                    key={p.id}
                    href={`/partners/${p.id}`}
                    className={`group bg-white rounded-3xl p-7 border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all relative overflow-hidden ${
                      closed ? "opacity-60" : ""
                    }`}
                  >
                    {closed && (
                      <span className="absolute top-5 right-5 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">
                        마감
                      </span>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                        <MapPin className="w-3 h-3" />
                        {p.destination}
                      </span>
                      {(p.start_date || p.end_date) && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {formatDate(p.start_date)}
                          {p.end_date && ` ~ ${formatDate(p.end_date)}`}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {p.title}
                    </h3>
                    {p.description && (
                      <p className="text-sm text-slate-500 line-clamp-2 mb-5 leading-relaxed">
                        {p.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        {author?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={author.image}
                            alt={author.name ?? ""}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                            {(author?.name ?? "익").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-semibold text-slate-900">
                              {author?.name ?? "익명"}
                            </p>
                            {author?.role && <RoleBadge role={author.role} size="xs" />}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {new Date(p.created_at).toLocaleDateString("ko-KR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                        <Users className="w-4 h-4 text-blue-500" />
                        {p.current_people} / {p.max_people}
                      </div>
                    </div>
                  </Link>
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
