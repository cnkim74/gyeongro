import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ItineraryView from "@/components/ItineraryView";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  SPECIALTY_BY_ID,
  LANGUAGE_BY_CODE,
} from "@/lib/sherpa";
import { matchSherpaToTrip, matchScoreColor } from "@/lib/matching";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Wallet,
  Mountain,
  Quote,
} from "lucide-react";
import ProposalForm from "./ProposalForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from("travel_plans")
    .select("title, destination")
    .eq("id", id)
    .eq("seeking_sherpa", true)
    .maybeSingle();
  if (!data) return { title: "공개 여행 - Pothos" };
  return { title: `${data.title} (${data.destination}) — 셰르파 매칭` };
}

export default async function OpenTripDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const supabase = getSupabaseServiceClient();

  const { data: sherpa } = await supabase
    .from("sherpas")
    .select(
      "id, status, countries, cities, languages, specialties, hourly_rate_krw, half_day_rate_krw, full_day_rate_krw"
    )
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!sherpa || sherpa.status !== "published") {
    redirect("/sherpa/open-trips");
  }

  const { data: trip } = await supabase
    .from("travel_plans")
    .select("*")
    .eq("id", id)
    .eq("seeking_sherpa", true)
    .maybeSingle();

  if (!trip) notFound();
  if (trip.user_id === session.user.id) {
    redirect(`/my-trips/${id}`);
  }

  // 매칭 점수
  const breakdown = matchSherpaToTrip(
    {
      countries: sherpa.countries,
      cities: sherpa.cities,
      cities_en: null,
      languages: sherpa.languages,
      specialties: sherpa.specialties,
      rating_avg: 0,
      rating_count: 0,
      booking_count: 0,
      hourly_rate_krw: sherpa.hourly_rate_krw,
      half_day_rate_krw: sherpa.half_day_rate_krw,
      full_day_rate_krw: sherpa.full_day_rate_krw,
    },
    {
      destination: trip.destination,
      sherpa_required_languages: trip.sherpa_required_languages ?? null,
      sherpa_required_specialties: trip.sherpa_required_specialties ?? null,
      sherpa_budget_max_krw: trip.sherpa_budget_max_krw ?? null,
    }
  );
  const matchMeta = matchScoreColor(breakdown.score);

  // 본인이 이미 제안했는지
  const { data: myProposal } = await supabase
    .from("sherpa_proposals")
    .select("id, status, proposed_price_krw, proposed_scope, message, created_at")
    .eq("trip_id", id)
    .eq("sherpa_id", sherpa.id)
    .maybeSingle();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href="/sherpa/open-trips"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> 공개 여행 목록
          </Link>

          {/* Hero */}
          <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-3xl border border-emerald-100 p-7 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-[0.2em]">
                <Mountain className="w-3.5 h-3.5" />
                매칭 공개 중
              </div>
              <div
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${matchMeta.bg} ${matchMeta.text}`}
              >
                {breakdown.score}% 매칭 · {matchMeta.label}
              </div>
            </div>

            {breakdown.reasons.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {breakdown.reasons.map((r, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-emerald-700 text-[11px] font-medium"
                  >
                    ✓ {r}
                  </span>
                ))}
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
              {trip.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {trip.destination}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {trip.days}박 {trip.days + 1}일
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {trip.people}명
              </span>
              {trip.sherpa_budget_max_krw && (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <Wallet className="w-3.5 h-3.5" />
                  최대{" "}
                  {(trip.sherpa_budget_max_krw / 10000).toLocaleString("ko-KR")}만원
                </span>
              )}
            </div>
          </div>

          {/* Sherpa request */}
          {(trip.sherpa_request_notes ||
            (trip.sherpa_required_specialties?.length ?? 0) > 0 ||
            (trip.sherpa_required_languages?.length ?? 0) > 0) && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-500 mb-3">
                여행자가 원하는 셰르파
              </h3>
              {trip.sherpa_request_notes && (
                <div className="bg-slate-50 rounded-xl p-3 mb-3 text-sm text-slate-700 italic">
                  <Quote className="w-3.5 h-3.5 inline text-slate-400 mr-1" />
                  {trip.sherpa_request_notes}
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {(trip.sherpa_required_specialties ?? []).map((s: string) => {
                  const meta = SPECIALTY_BY_ID[s];
                  return (
                    <span
                      key={s}
                      className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium"
                    >
                      {meta?.emoji} {meta?.label ?? s}
                    </span>
                  );
                })}
                {(trip.sherpa_required_languages ?? []).map((l: string) => {
                  const meta = LANGUAGE_BY_CODE[l];
                  return (
                    <span
                      key={l}
                      className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
                    >
                      {meta?.emoji} {meta?.label ?? l}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Itinerary */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-bold text-slate-700 mb-3">
                여행 일정
              </h3>
              <ItineraryView itinerary={trip.itinerary} destination={trip.destination} />
            </div>

            {/* Proposal form */}
            <aside className="lg:sticky lg:top-24 h-fit">
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  제안 제출
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  제안금액과 메시지를 보내면 여행자가 검토 후 회신합니다.
                </p>

                {myProposal ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm">
                    <p className="font-bold text-emerald-900 mb-1">
                      이미 제안하셨어요
                    </p>
                    <p className="text-emerald-700 mb-2">
                      <span className="font-semibold">
                        {(myProposal.proposed_price_krw / 10000).toLocaleString(
                          "ko-KR"
                        )}
                        만원
                      </span>{" "}
                      · {myProposal.proposed_scope}
                    </p>
                    <p className="text-xs text-emerald-600">
                      상태:{" "}
                      {myProposal.status === "pending"
                        ? "대기 중"
                        : myProposal.status === "accepted"
                        ? "✅ 수락됨"
                        : myProposal.status === "declined"
                        ? "거절됨"
                        : myProposal.status === "withdrawn"
                        ? "철회됨"
                        : myProposal.status}
                    </p>
                  </div>
                ) : (
                  <ProposalForm
                    tripId={trip.id}
                    budgetMax={trip.sherpa_budget_max_krw}
                  />
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
