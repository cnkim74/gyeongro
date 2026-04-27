import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import ItineraryView from "@/components/ItineraryView";
import TravelEssentials from "@/components/TravelEssentials";
import SherpaMatchingPanel, {
  type ProposalItem,
} from "@/components/SherpaMatchingPanel";
import ReviewForm from "@/components/ReviewForm";
import { ArrowLeft, Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const supabase = getSupabaseServiceClient();
  const { data: trip, error } = await supabase
    .from("travel_plans")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (error || !trip) notFound();

  // 셰르파 제안들 (조인)
  const { data: proposalsRaw } = await supabase
    .from("sherpa_proposals")
    .select(
      "id, proposed_price_krw, proposed_scope, message, status, created_at, sherpas(id, slug, display_name, tagline, avatar_url, rating_avg, rating_count, booking_count, languages, specialties)"
    )
    .eq("trip_id", id)
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proposals: ProposalItem[] = (proposalsRaw ?? []).map((p: any) => ({
    id: p.id,
    proposed_price_krw: p.proposed_price_krw,
    proposed_scope: p.proposed_scope,
    message: p.message,
    status: p.status,
    created_at: p.created_at,
    sherpa: {
      id: p.sherpas?.id ?? "",
      slug: p.sherpas?.slug ?? "",
      display_name: p.sherpas?.display_name ?? "셰르파",
      tagline: p.sherpas?.tagline ?? null,
      avatar_url: p.sherpas?.avatar_url ?? null,
      rating_avg: p.sherpas?.rating_avg ?? null,
      rating_count: p.sherpas?.rating_count ?? 0,
      booking_count: p.sherpas?.booking_count ?? 0,
      languages: p.sherpas?.languages ?? [],
      specialties: p.sherpas?.specialties ?? [],
    },
  }));

  // 수락된 제안이 있으면 후기 작성 가능 여부 체크
  const acceptedProposal = proposals.find((p) => p.status === "accepted");
  let canReviewSherpa = false;
  if (acceptedProposal) {
    const { data: existing } = await supabase
      .from("sherpa_reviews")
      .select("id")
      .eq("proposal_id", acceptedProposal.id)
      .maybeSingle();
    canReviewSherpa = !existing;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <Link
            href="/my-trips"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />내 여행 목록으로
          </Link>

          <SherpaMatchingPanel
            tripId={trip.id}
            initialSeeking={!!trip.seeking_sherpa}
            initialNotes={trip.sherpa_request_notes ?? null}
            initialLanguages={trip.sherpa_required_languages ?? []}
            initialSpecialties={trip.sherpa_required_specialties ?? []}
            initialBudgetMax={trip.sherpa_budget_max_krw ?? null}
            proposals={proposals}
          />

          {acceptedProposal && canReviewSherpa && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 mb-8">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                <h3 className="text-lg font-bold text-slate-900">
                  매칭 후기 남기기
                </h3>
              </div>
              <p className="text-sm text-slate-600 mb-5">
                <span className="font-semibold">
                  {acceptedProposal.sherpa.display_name}
                </span>{" "}
                셰르파와의 경험은 어땠나요? 다른 여행자에게 큰 도움이 됩니다.
              </p>
              <div className="bg-white rounded-2xl p-5">
                <ReviewForm
                  sherpaId={acceptedProposal.sherpa.id}
                  sherpaName={acceptedProposal.sherpa.display_name}
                  proposalId={acceptedProposal.id}
                />
              </div>
            </div>
          )}

          <ItineraryView itinerary={trip.itinerary} destination={trip.destination} />
          <TravelEssentials />
        </div>
      </main>
    </div>
  );
}
