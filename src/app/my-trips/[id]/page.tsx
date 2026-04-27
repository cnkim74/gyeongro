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
import { ArrowLeft } from "lucide-react";

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

          <ItineraryView itinerary={trip.itinerary} destination={trip.destination} />
          <TravelEssentials />
        </div>
      </main>
    </div>
  );
}
