import Link from "next/link";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Sparkles, ArrowRight, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "테마 여행 - Pothos",
};

const CATEGORY_LABELS: Record<string, string> = {
  movie_drama: "🎬 영화·드라마",
  anime: "🌸 애니메이션",
  bbang: "🥐 빵지순례",
  local_food: "🍱 로컬 푸드",
  food: "🍜 미식",
  nature: "🌿 자연",
  culture: "🏛️ 역사·문화",
};

interface ThemeRow {
  id: string;
  slug: string;
  category: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_image_url: string | null;
  destination: string | null;
  view_count: number;
}

export default async function ThemesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = getSupabaseServiceClient();
  let query = supabase
    .from("curated_themes")
    .select("id, slug, category, title, subtitle, description, cover_image_url, destination, view_count")
    .eq("is_published", true)
    .order("display_order")
    .order("created_at");
  if (category) query = query.eq("category", category);

  const { data: themes } = await query;

  // 카테고리 목록 (현재 등록된 것만)
  const { data: catRows } = await supabase
    .from("curated_themes")
    .select("category")
    .eq("is_published", true);
  const cats = [...new Set((catRows ?? []).map((r) => r.category))];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-600 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" /> 큐레이션 테마
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              테마 여행
            </h1>
            <p className="text-gray-500 text-lg">
              영화·드라마 촬영지부터 애니 성지순례, 빵지순례까지
            </p>
          </div>

          {cats.length > 0 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 justify-center flex-wrap">
              <Link
                href="/themes"
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !category
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
                }`}
              >
                전체
              </Link>
              {cats.map((c) => (
                <Link
                  key={c}
                  href={`/themes?category=${c}`}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    category === c
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {CATEGORY_LABELS[c] ?? c}
                </Link>
              ))}
            </div>
          )}

          {!themes || themes.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
              <p className="text-gray-500 mb-3">아직 등록된 테마가 없어요</p>
              <p className="text-xs text-gray-400">관리자가 테마를 추가하면 여기에 표시됩니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(themes as ThemeRow[]).map((t) => (
                <Link
                  key={t.id}
                  href={`/themes/${t.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-indigo-600 relative">
                    {t.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.cover_image_url}
                        alt={t.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-6xl">
                        {(CATEGORY_LABELS[t.category] ?? "").split(" ")[0]}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">
                        {CATEGORY_LABELS[t.category] ?? t.category}
                      </span>
                      {t.destination && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-500 font-medium">
                          <MapPin className="w-3 h-3" />
                          {t.destination}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {t.title}
                    </h3>
                    {t.subtitle && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {t.subtitle}
                      </p>
                    )}
                    <div className="flex items-center justify-end mt-3 text-blue-500 text-sm font-semibold">
                      자세히 보기 <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
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
