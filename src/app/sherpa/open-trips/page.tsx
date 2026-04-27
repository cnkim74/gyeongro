import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  SPECIALTY_BY_ID,
  LANGUAGE_BY_CODE,
} from "@/lib/sherpa";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Wallet,
  ArrowRight,
  Inbox,
  Mountain,
} from "lucide-react";

export const metadata = {
  title: "공개된 여행 — 셰르파 매칭 · Pothos",
};

export const dynamic = "force-dynamic";

interface OpenTrip {
  id: string;
  title: string;
  destination: string;
  days: number;
  people: number;
  budget: number;
  themes: string[] | null;
  sherpa_request_notes: string | null;
  sherpa_required_languages: string[] | null;
  sherpa_required_specialties: string[] | null;
  sherpa_budget_max_krw: number | null;
  open_at: string | null;
  has_my_proposal: boolean;
}

export default async function OpenTripsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/sherpa/open-trips");

  const supabase = getSupabaseServiceClient();

  // 셰르파 본인 확인
  const { data: sherpa } = await supabase
    .from("sherpas")
    .select("id, status, countries, cities, languages, specialties")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!sherpa) {
    return (
      <NotASherpaScreen reason="not_registered" />
    );
  }
  if (sherpa.status !== "published") {
    return <NotASherpaScreen reason="pending" />;
  }

  // 공개 여행 목록 (이미 본인 제안한 건 표시만 다르게)
  const { data: trips } = await supabase
    .from("travel_plans")
    .select(
      "id, title, destination, days, people, budget, themes, sherpa_request_notes, sherpa_required_languages, sherpa_required_specialties, sherpa_budget_max_krw, open_at"
    )
    .eq("seeking_sherpa", true)
    .neq("user_id", session.user.id)
    .order("open_at", { ascending: false, nullsFirst: false })
    .limit(50);

  // 본인 제안 여부 매핑
  const tripIds = (trips ?? []).map((t) => t.id);
  let myProposals: { trip_id: string }[] = [];
  if (tripIds.length > 0) {
    const { data } = await supabase
      .from("sherpa_proposals")
      .select("trip_id")
      .eq("sherpa_id", sherpa.id)
      .in("trip_id", tripIds);
    myProposals = data ?? [];
  }
  const proposedSet = new Set(myProposals.map((p) => p.trip_id));

  const openTrips: OpenTrip[] = (trips ?? []).map((t) => ({
    ...t,
    has_my_proposal: proposedSet.has(t.id),
  }));

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href="/sherpa"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> 셰르파 홈
          </Link>

          <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] text-emerald-600 uppercase mb-1">
                Sherpa Marketplace
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                공개된 여행 {openTrips.length}개
              </h1>
              <p className="text-slate-500 text-sm mt-2">
                여행자가 도움을 요청한 일정에 제안금액과 함께 합류 신청을 할 수
                있어요.
              </p>
            </div>
            <Link
              href="/sherpa"
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              내 프로필 보기 →
            </Link>
          </div>

          {openTrips.length === 0 ? (
            <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-16 text-center">
              <Inbox className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">
                아직 공개된 여행이 없어요. 곧 추가됩니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {openTrips.map((t) => (
                <OpenTripCard key={t.id} trip={t} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function OpenTripCard({ trip }: { trip: OpenTrip }) {
  return (
    <Link
      href={`/sherpa/open-trips/${trip.id}`}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg hover:-translate-y-0.5 transition-all p-5"
    >
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
        <MapPin className="w-3 h-3" />
        {trip.destination}
        <span className="text-slate-300">·</span>
        <Calendar className="w-3 h-3" />
        {trip.days}박 {trip.days + 1}일
        <span className="text-slate-300">·</span>
        <Users className="w-3 h-3" />
        {trip.people}명
      </div>

      <h3 className="font-bold text-slate-900 mb-2 tracking-tight group-hover:text-emerald-600 line-clamp-1">
        {trip.title}
      </h3>

      {trip.sherpa_request_notes && (
        <p className="text-sm text-slate-600 line-clamp-2 mb-3 italic">
          &ldquo;{trip.sherpa_request_notes}&rdquo;
        </p>
      )}

      <div className="flex flex-wrap gap-1 mb-3">
        {(trip.sherpa_required_specialties ?? []).slice(0, 3).map((s) => {
          const meta = SPECIALTY_BY_ID[s];
          return (
            <span
              key={s}
              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium"
            >
              {meta?.emoji} {meta?.label ?? s}
            </span>
          );
        })}
        {(trip.sherpa_required_languages ?? []).slice(0, 3).map((l) => {
          const meta = LANGUAGE_BY_CODE[l];
          return (
            <span
              key={l}
              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium"
            >
              {meta?.emoji} {meta?.label ?? l}
            </span>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Wallet className="w-3.5 h-3.5" />
          {trip.sherpa_budget_max_krw
            ? `최대 ${(trip.sherpa_budget_max_krw / 10000).toLocaleString("ko-KR")}만원`
            : "예산 미정"}
        </div>
        {trip.has_my_proposal ? (
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-600">
            <Mountain className="w-3.5 h-3.5" />
            제안 완료
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
            제안하기
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        )}
      </div>
    </Link>
  );
}

function NotASherpaScreen({ reason }: { reason: "not_registered" | "pending" }) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 pt-24 pb-20 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center">
          <Mountain className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          {reason === "not_registered" ? (
            <>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                셰르파 전용 페이지입니다
              </h1>
              <p className="text-slate-500 mb-6">
                여행자의 일정에 제안하려면 먼저 셰르파로 등록해주세요.
              </p>
              <Link
                href="/sherpa/become"
                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
              >
                셰르파 신청하기
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">검수 중입니다</h1>
              <p className="text-slate-500 mb-6">
                신청해주신 셰르파 프로필이 운영팀 검수 중이에요.
                <br />
                승인 후 공개 여행에 제안하실 수 있습니다.
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
