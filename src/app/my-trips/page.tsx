import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Bookmark, MapPin, Calendar, Users, ArrowRight, Sparkles } from "lucide-react";
import MyTripsActions from "./MyTripsActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "내 여행 계획 - 경로",
};

export default async function MyTripsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/my-trips");

  const supabase = getSupabaseServiceClient();
  const { data: trips } = await supabase
    .from("travel_plans")
    .select("id, title, destination, days, people, budget, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Bookmark className="w-7 h-7 text-blue-500" />
                내 여행 계획
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                저장된 여행 일정을 관리하세요
              </p>
            </div>
            <Link
              href="/planner"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="w-4 h-4" />새 계획 만들기
            </Link>
          </div>

          {!trips || trips.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                아직 저장된 여행 계획이 없어요
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                AI 플래너로 첫 여행 계획을 만들어보세요
              </p>
              <Link
                href="/planner"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                <Sparkles className="w-4 h-4" />
                여행 계획 시작하기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all relative"
                >
                  <Link href={`/my-trips/${trip.id}`} className="block">
                    <div className="flex items-start justify-between mb-3">
                      <span className="inline-flex items-center gap-1 text-xs text-blue-500 font-medium bg-blue-50 px-2.5 py-1 rounded-full">
                        <MapPin className="w-3 h-3" />
                        {trip.destination}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(trip.created_at).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {trip.title}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {trip.days}박 {trip.days + 1}일
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {trip.people}명
                      </span>
                      <span className="text-emerald-600 font-semibold">
                        {trip.budget.toLocaleString()}원
                      </span>
                    </div>
                  </Link>
                  <MyTripsActions tripId={trip.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
