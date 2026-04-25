import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import ItineraryView from "@/components/ItineraryView";
import TravelEssentials from "@/components/TravelEssentials";
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
          <ItineraryView itinerary={trip.itinerary} destination={trip.destination} />
          <TravelEssentials />
        </div>
      </main>
    </div>
  );
}
