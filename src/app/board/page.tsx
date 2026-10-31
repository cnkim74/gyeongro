import Link from "next/link";
import FirstPostEventBanner from "@/components/FirstPostEventBanner";
import InviteCard from "@/components/InviteCard";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MessageSquare, ArrowRight, Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "커뮤니티 - Pothos",
};

export default async function BoardListPage() {
  const supabase = getSupabaseServiceClient();
  const { data: boards } = await supabase
    .from("boards")
    .select("id, slug, name, description, icon, post_count, is_admin_only")
    .eq("is_published", true)
    .order("display_order")
    .order("created_at");

  const session = await auth();
  const adminFlag = session?.user?.id ? await isAdmin(session.user.id) : false;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-7 h-7 text-blue-500" />
                커뮤니티
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                여행자들의 다양한 이야기가 모이는 곳
              </p>
            </div>
            {adminFlag && (
              <Link
                href="/admin/boards"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-700 text-sm font-semibold hover:bg-purple-100 transition-colors"
              >
                <Settings className="w-4 h-4" />
                게시판 관리
              </Link>
            )}
          </div>

          <FirstPostEventBanner href="/board/tip/new" cta="첫 글 쓰러 가기" />

          {!boards || boards.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">아직 등록된 게시판이 없어요</p>
              {adminFlag && (
                <Link
                  href="/admin/boards"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
                >
                  게시판 추가하기
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {boards.map((b) => (
                <Link
                  key={b.id}
                  href={`/board/${b.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl shrink-0">
                      {b.icon ?? "📋"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {b.name}
                        </h3>
                        {b.is_admin_only && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
                            관리자
                          </span>
                        )}
                      </div>
                      {b.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                          {b.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>게시글 {b.post_count.toLocaleString()}개</span>
                        <ArrowRight className="w-3 h-3 ml-auto group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-5 mt-8">
            <InviteCard />
            <div className="rounded-3xl p-5 sm:p-6 border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50">
              <h2 className="text-lg font-bold text-gray-900">🧭 셰르파·여행 파트너이신가요?</h2>
              <p className="text-[15px] text-gray-600 mt-1">
                현지 가이드, 숙소·체험 업체라면 본인 이름으로 소개 글을 올려 주세요. 여행자들에게 직접 알릴 수 있어요.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Link href="/sherpa/become" className="px-5 py-3 rounded-2xl bg-amber-500 text-white text-[15px] font-bold">
                  셰르파 등록하기
                </Link>
                <Link href="/board/free/new" className="px-5 py-3 rounded-2xl border border-amber-200 bg-white text-[15px] font-semibold text-amber-700">
                  자유게시판에 소개 글 쓰기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
