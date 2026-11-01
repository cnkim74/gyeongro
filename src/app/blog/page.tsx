import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogCard from "@/components/blog/BlogCard";
import BlogCta from "@/components/blog/BlogCta";
import { listPublishedPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "여행 인사이트 블로그 - Pothos",
  description: "여행지 고르기부터 일정·예산·교통·축제까지, 떠나기 전에 알아두면 좋은 여행 정보를 정리했어요.",
  alternates: { canonical: "/blog" },
};

export default async function BlogListPage() {
  const posts = await listPublishedPosts();
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <p className="text-xs font-bold tracking-[0.2em] text-slate-400">TRAVEL INSIGHT</p>
          <h1 className="mt-3 text-[34px] sm:text-5xl font-extrabold tracking-tight text-slate-900">
            떠나기 전에 읽는 여행 인사이트<span className="text-blue-600">.</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-2xl leading-relaxed">
            여행지 고르기, 일정·예산 짜기, 교통·축제 정보까지 — 여행자들이 자주 묻는 것들을 직접 정리했어요.
          </p>

          {posts.length === 0 ? (
            <div className="mt-14 rounded-3xl bg-slate-50 p-12 text-center text-slate-500">
              첫 번째 여행 인사이트를 준비하고 있어요. 곧 만나요!
            </div>
          ) : (
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
              {posts.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </div>
      </main>
      <BlogCta variant="band" />
      <Footer />
    </div>
  );
}
