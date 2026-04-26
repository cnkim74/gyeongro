import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";
import Header from "@/components/Header";
import StarRating from "@/components/StarRating";
import RoleBadge from "@/components/RoleBadge";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import ReviewActions from "./ReviewActions";
import type { UserRole } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseServiceClient();

  const { data: review } = await supabase
    .from("reviews")
    .select("id, title, content, rating, destination, created_at, user_id, is_deleted, trip_id")
    .eq("id", id)
    .single();

  if (!review || review.is_deleted) notFound();

  const { data: author } = await supabase
    .schema("next_auth")
    .from("users")
    .select("name, image, custom_image, role, business_name")
    .eq("id", review.user_id)
    .single();

  let linkedTrip: { id: string; title: string } | null = null;
  if (review.trip_id) {
    const { data: t } = await supabase
      .from("travel_plans")
      .select("id, title")
      .eq("id", review.trip_id)
      .single();
    linkedTrip = t;
  }

  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  const adminFlag = currentUserId ? await isAdmin(currentUserId) : false;
  const canEdit = currentUserId === review.user_id || adminFlag;

  const authorRole: UserRole =
    author?.role === "admin" || author?.role === "business" || author?.role === "user"
      ? author.role
      : "user";
  const authorName =
    authorRole === "business" && author?.business_name
      ? author.business_name
      : author?.name ?? "익명";
  const authorImage = author?.custom_image ?? author?.image ?? null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            href="/reviews"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> 후기 목록으로
          </Link>

          <article className="bg-white rounded-3xl border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-4">
              <StarRating value={review.rating} readonly size="lg" />
              <span className="text-2xl font-bold text-gray-900">
                {review.rating}.0
              </span>
            </div>

            {review.destination && (
              <div className="inline-flex items-center gap-1 text-sm text-blue-500 font-medium bg-blue-50 px-3 py-1 rounded-full mb-3">
                <MapPin className="w-3.5 h-3.5" />
                {review.destination}
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 break-words">
              {review.title}
            </h1>

            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {authorImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={authorImage}
                    alt={authorName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    {authorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-900">{authorName}</p>
                    <RoleBadge role={authorRole} size="xs" />
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(review.created_at).toLocaleString("ko-KR")}
                  </p>
                </div>
              </div>

              {canEdit && (
                <ReviewActions reviewId={review.id} />
              )}
            </div>

            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap break-words mb-6">
              {review.content}
            </div>

            {linkedTrip && (
              <Link
                href={`/my-trips/${linkedTrip.id}`}
                className="block bg-blue-50 rounded-2xl p-4 hover:bg-blue-100 transition-colors"
              >
                <p className="text-xs font-bold text-blue-600 mb-1">연결된 여행 계획</p>
                <p className="text-sm font-semibold text-gray-900">
                  {linkedTrip.title} →
                </p>
              </Link>
            )}
          </article>
        </div>
      </main>
    </div>
  );
}
