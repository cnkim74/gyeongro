import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  Users,
  MessageSquare,
  Map,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "관리자 대시보드 - 경로",
};

export default async function AdminDashboardPage() {
  await requireAdmin();

  const supabase = getSupabaseServiceClient();
  const [
    { count: userCount },
    { count: postCount },
    { count: tripCount },
    { count: commentCount },
  ] = await Promise.all([
    supabase.schema("next_auth").from("users").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("is_deleted", false),
    supabase.from("travel_plans").select("*", { count: "exact", head: true }),
    supabase.from("comments").select("*", { count: "exact", head: true }).eq("is_deleted", false),
  ]);

  const stats = [
    { label: "전체 사용자", value: userCount ?? 0, icon: Users, color: "from-blue-500 to-cyan-500", href: "/admin/users" },
    { label: "전체 게시글", value: postCount ?? 0, icon: MessageSquare, color: "from-purple-500 to-pink-500", href: "/admin/posts" },
    { label: "전체 여행계획", value: tripCount ?? 0, icon: Map, color: "from-emerald-500 to-teal-500", href: "/admin/trips" },
    { label: "전체 댓글", value: commentCount ?? 0, icon: TrendingUp, color: "from-orange-500 to-rose-500", href: "/admin/posts" },
  ];

  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">관리자 대시보드</h1>
      <p className="text-sm text-gray-500 mb-8">서비스 전반을 관리하세요</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {s.value.toLocaleString()}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: "/admin/users", icon: Users, title: "사용자 관리", desc: "권한 등급 변경 (일반/기업회원/관리자)" },
          { href: "/admin/posts", icon: MessageSquare, title: "게시글 관리", desc: "게시글 검토, 삭제, 고정" },
          { href: "/admin/trips", icon: Map, title: "여행 계획", desc: "전체 여행 계획 조회" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group bg-white rounded-2xl border border-gray-100 p-6 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <Icon className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                {item.title}
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
