import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TravelEssentials from "@/components/TravelEssentials";
import { ArrowLeft, MapPin, Sparkles, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  movie_drama: "🎬 영화·드라마",
  anime: "🌸 애니메이션",
  bbang: "🥐 빵지순례",
  local_food: "🍱 로컬 푸드",
  food: "🍜 미식",
  nature: "🌿 자연",
  culture: "🏛️ 역사·문화",
};

interface Spot {
  name: string;
  area?: string;
  desc?: string;
  drama?: string;
  movie?: string;
  anime?: string;
  signature?: string;
  tip?: string;
}

export default async function ThemeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = getSupabaseServiceClient();

  const { data: theme } = await supabase
    .from("curated_themes")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!theme) notFound();

  // 조회수 증가
  await supabase
    .from("curated_themes")
    .update({ view_count: (theme.view_count ?? 0) + 1 })
    .eq("id", theme.id);

  const spots = (theme.spots ?? []) as Spot[];
  const tips = (theme.tips ?? []) as string[];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            href="/themes"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> 테마 목록으로
          </Link>

          <article className="bg-white rounded-3xl border border-gray-100 p-8 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 font-medium">
                {CATEGORY_LABELS[theme.category] ?? theme.category}
              </span>
              {theme.destination && (
                <span className="inline-flex items-center gap-1 text-xs text-blue-500 font-medium bg-blue-50 px-2.5 py-1 rounded-full">
                  <MapPin className="w-3.5 h-3.5" />
                  {theme.destination}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">{theme.title}</h1>
            {theme.subtitle && (
              <p className="text-lg text-gray-600 mb-4">{theme.subtitle}</p>
            )}
            {theme.description && (
              <p className="text-gray-700 leading-relaxed pb-6 border-b border-gray-100">
                {theme.description}
              </p>
            )}

            {spots.length > 0 && (
              <div className="mt-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  추천 스팟 {spots.length}곳
                </h2>
                <div className="space-y-3">
                  {spots.map((spot, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 rounded-2xl p-4 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-gray-900">{spot.name}</h3>
                            {spot.area && (
                              <span className="text-xs text-gray-400">
                                @{spot.area}
                              </span>
                            )}
                          </div>
                          {(spot.drama || spot.movie || spot.anime || spot.signature) && (
                            <p className="text-xs text-blue-600 font-semibold mb-1">
                              {spot.drama || spot.movie || spot.anime || spot.signature}
                            </p>
                          )}
                          {spot.desc && (
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {spot.desc}
                            </p>
                          )}
                          {spot.tip && (
                            <div className="mt-2 px-3 py-1.5 bg-amber-50 rounded-lg text-xs text-amber-700">
                              💡 {spot.tip}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tips.length > 0 && (
              <div className="mt-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  여행 팁
                </h3>
                <ul className="space-y-1.5">
                  {tips.map((tip, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-amber-500">•</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <Link
                href={`/planner?destination=${encodeURIComponent(theme.destination ?? "")}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold hover:shadow-xl transition-all"
              >
                <Sparkles className="w-5 h-5" />
                이 테마로 AI 일정 만들기
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </article>

          <TravelEssentials />
        </div>
      </main>
      <Footer />
    </div>
  );
}
