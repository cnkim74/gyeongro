import Link from "next/link";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RoleBadge from "@/components/RoleBadge";
import { BookOpen, Plus, MapPin, Heart, Eye } from "lucide-react";
import type { UserRole } from "@/lib/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "여행 스토리 - 경로",
};

interface StoryRow {
  id: string;
  title: string;
  subtitle: string | null;
  destination: string | null;
  cover_image_url: string | null;
  duration_text: string | null;
  view_count: number;
  like_count: number;
  created_at: string;
  user_id: string;
}

export default async function StoriesPage() {
  const supabase = getSupabaseServiceClient();
  const { data: stories } = await supabase
    .from("stories")
    .select(
      "id, title, subtitle, destination, cover_image_url, duration_text, view_count, like_count, created_at, user_id"
    )
    .eq("is_published", true)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(30);

  const userIds = [...new Set((stories ?? []).map((s) => s.user_id))];
  const usersMap: Record<
    string,
    { name: string | null; image: string | null; role: UserRole }
  > = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id, name, image, custom_image, role")
      .in("id", userIds);
    for (const u of users ?? []) {
      const role: UserRole =
        u.role === "admin" || u.role === "business" || u.role === "user"
          ? u.role
          : "user";
      usersMap[u.id] = {
        name: u.name,
        image: u.custom_image ?? u.image,
        role,
      };
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-semibold text-blue-600 mb-2 tracking-wide">
                ORIGINAL STORIES
              </p>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
                나만의 여행 이야기
              </h1>
              <p className="text-slate-500">
                평범하지 않은, 당신만의 독창적인 여행 기록을 들려주세요
              </p>
            </div>
            <Link
              href="/stories/new"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              스토리 쓰기
            </Link>
          </div>

          {!stories || stories.length === 0 ? (
            <div className="bg-slate-50 rounded-3xl p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                첫 스토리를 기다리고 있어요
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                당신의 여행 이야기로 다른 여행자에게 영감을 주세요
              </p>
              <Link
                href="/stories/new"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
              >
                <Plus className="w-4 h-4" />첫 스토리 작성
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(stories as StoryRow[]).map((s) => {
                const author = usersMap[s.user_id];
                return (
                  <Link
                    key={s.id}
                    href={`/stories/${s.id}`}
                    className="group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-blue-500 to-indigo-600 relative overflow-hidden">
                      {s.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.cover_image_url}
                          alt={s.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-white/40" />
                        </div>
                      )}
                      {s.destination && (
                        <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-xs font-semibold text-white bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full">
                          <MapPin className="w-3 h-3" />
                          {s.destination}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-slate-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                        {s.title}
                      </h3>
                      {s.subtitle && (
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                          {s.subtitle}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
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
                          <div>
                            <div className="flex items-center gap-1">
                              <p className="text-xs font-semibold text-slate-700">
                                {author?.name ?? "익명"}
                              </p>
                              {author?.role && <RoleBadge role={author.role} size="xs" />}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {s.like_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {s.view_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
