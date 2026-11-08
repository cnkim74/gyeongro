// 회원 여행 일정 상세 (관리자 열람 전용 — 수정·삭제 없음)
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import ItineraryView from "@/components/ItineraryView";
import { themeLabel, PLANNER_STYLES } from "@/lib/planner-options";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "회원 여행 일정 - Pothos" };

export default async function AdminTripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = getSupabaseServiceClient();
  const { data: trip } = await supabase.from("travel_plans").select("*").eq("id", id).maybeSingle();
  if (!trip) notFound();
  const { data: user } = await supabase.schema("next_auth").from("users").select("nickname, name, email").eq("id", trip.user_id).maybeSingle();

  return (
    <div className="p-6 lg:p-10 max-w-5xl">
      <Link href="/admin/trips" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="w-4 h-4" /> 회원 여행 일정
      </Link>
      <div className="mt-3 rounded-2xl bg-white border border-gray-100 p-5">
        <p className="text-xs text-gray-400">
          {user?.nickname ?? user?.name ?? "회원"} {user?.email && `· ${user.email}`} · 저장 {new Date(trip.created_at).toLocaleString("ko-KR")}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-gray-900">{trip.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold">📍 {trip.destination}</span>
          <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
            {trip.days}박 {trip.days + 1}일
          </span>
          <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">{trip.people}명</span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold">
            {Number(trip.budget).toLocaleString()}원 (1인 {Math.round(Number(trip.budget) / Math.max(1, trip.people)).toLocaleString()}원)
          </span>
          {trip.travel_style && <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">{PLANNER_STYLES[trip.travel_style] ?? trip.travel_style}</span>}
          {(Array.isArray(trip.themes) ? trip.themes : []).map((t: string) => (
            <span key={t} className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
              {themeLabel(t)}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-gray-400">관리자 열람 화면이에요. 회원의 일정은 수정·삭제되지 않아요.</p>
      </div>
      <div className="mt-6">
        <ItineraryView itinerary={trip.itinerary} destination={trip.destination} />
      </div>
    </div>
  );
}
