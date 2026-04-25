import Link from "next/link";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StarRating from "@/components/StarRating";
import { Star, Sparkles, MapPin, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "여행 후기 - 경로",
};

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const { sort = "recent", page: pageStr = "1" } = await searchParams;
  const page = parseInt(pageStr, 10);
  const limit = 12;
  const offset = (page - 1) * limit;

  const supabase = getSupabaseServiceClient();
  let query = supabase
    .from("reviews")
    .select("id, title, content, rating, destination, created_at, user_id", {
      count: "exact",
    })
    .eq("is_deleted", false);

  if (sort === "rating") {
    query = query
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: reviews, count } = await query.range(offset, offset + limit - 1);

  const userIds = [...new Set((reviews ?? []).map((r) => r.user_id))];
  const usersMap: Record<string, { name: string | null; image: string | null }> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id, name, image, custom_image")
      .in("id", userIds);
    for (const u of users ?? []) {
      usersMap[u.id] = { name: u.name, image: u.custom_image ?? u.image };
    }
  }

  // 평균 별점 계산
  const { data: allRatings } = await supabase
    .from("reviews")
    .select("rating")
    .eq("is_deleted", false);
  const totalRatings = allRatings?.length ?? 0;
  const avgRating =
    totalRatings > 0
      ? (allRatings!.reduce((s, r) => s + r.rating, 0) / totalRatings)
      : 0;

  const totalPages = Math.ceil((count ?? 0) / limit);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">여행 후기</h1>
            <p className="text-gray-500 mb-6">실제 여행자들의 생생한 경험담</p>
            {totalRatings > 0 && (
              <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 border border-gray-100 shadow-sm">
                <StarRating value={Math.round(avgRating)} readonly size="md" />
                <span className="font-bold text-gray-900 text-lg">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">
                  ({totalRatings.toLocaleString()}개 후기)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <Link
                href="/reviews"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  sort === "recent"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
                }`}
              >
                최신순
              </Link>
              <Link
                href="/reviews?sort=rating"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  sort === "rating"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
                }`}
              >
                별점순
              </Link>
            </div>

            <Link
              href="/reviews/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              후기 작성
            </Link>
          </div>

          {!reviews || reviews.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">아직 후기가 없어요</p>
              <Link
                href="/reviews/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600"
              >
                첫 후기 작성하기 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map((r) => {
                const author = usersMap[r.user_id];
                return (
                  <Link
                    key={r.id}
                    href={`/reviews/${r.id}`}
                    className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <StarRating value={r.rating} readonly size="sm" />
                      {r.destination && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-500 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                          <MapPin className="w-3 h-3" />
                          {r.destination}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {r.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                      {r.content}
                    </p>
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                      {author?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={author.image}
                          alt={author.name ?? ""}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                          {(author?.name ?? "익").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">
                          {author?.name ?? "익명"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(r.created_at).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-1 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/reviews?${sort !== "recent" ? `sort=${sort}&` : ""}page=${p}`}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
