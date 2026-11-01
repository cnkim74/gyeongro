import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogCover from "@/components/blog/BlogCover";
import BlogMarkdown from "@/components/blog/BlogMarkdown";
import BlogCard from "@/components/blog/BlogCard";
import BlogCta from "@/components/blog/BlogCta";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getPost, listRelatedPosts, increaseView, tocOf, readMinutes, formatBlogDate } from "@/lib/blog";
import { ArrowLeft, ChevronDown } from "lucide-react";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://pothostravel.com";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(decodeURIComponent(slug));
  if (!post) return { title: "블로그 - Pothos" };
  return {
    title: `${post.title} | Pothos 블로그`,
    description: post.excerpt || undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt || undefined,
      url: `${SITE}/blog/${post.slug}`,
      publishedTime: post.published_at ?? undefined,
      ...(post.cover_image_url ? { images: [post.cover_image_url] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const session = await auth();
  const admin = session?.user?.id ? await isAdmin(session.user.id) : false;
  const post = await getPost(decodeURIComponent(slug), admin);
  if (!post) notFound();

  if (post.is_published) await increaseView(post.id, post.view_count);
  const toc = tocOf(post.content);
  const related = await listRelatedPosts(post);
  const date = post.published_at ?? post.created_at;

  // 검색엔진용 구조화 데이터 (글 + 자주 묻는 질문)
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.published_at ?? post.created_at,
      dateModified: post.updated_at,
      mainEntityOfPage: `${SITE}/blog/${post.slug}`,
      ...(post.cover_image_url ? { image: post.cover_image_url } : {}),
      author: { "@type": "Organization", name: "Pothos" },
      publisher: { "@type": "Organization", name: "Pothos" },
    },
    ...(post.faq.length > 0
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: post.faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <main className="flex-1 pt-28 pb-20">
        <article className="max-w-3xl mx-auto px-5 sm:px-6">
          {!post.is_published && (
            <p className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              아직 공개되지 않은 글이에요. 관리자에게만 보이는 미리보기입니다.
            </p>
          )}
          <Link href="/blog" className="inline-flex items-center gap-1 text-xs font-bold tracking-widest text-slate-400 hover:text-slate-700">
            <ArrowLeft className="w-3.5 h-3.5" /> TRAVEL INSIGHT
          </Link>

          <p className="mt-6 flex flex-wrap items-center gap-x-2 text-sm text-slate-400">
            {post.category && <span className="font-semibold text-blue-600">#{post.category}</span>}
            <span>{formatBlogDate(date)}</span>
            <span>· {readMinutes(post.content)}분 읽기</span>
          </p>
          <h1 className="mt-3 text-[30px] sm:text-[42px] font-extrabold tracking-tight leading-[1.25] text-slate-900">{post.title}</h1>
          {post.excerpt && <p className="mt-5 text-lg text-slate-500 leading-relaxed">{post.excerpt}</p>}

          <div className="mt-9 aspect-[16/9] rounded-3xl overflow-hidden">
            <BlogCover title={post.title} category={post.category} image={post.cover_image_url} coverStyle={post.cover_style} size="hero" />
          </div>

          {toc.length >= 2 && (
            <nav className="mt-10 rounded-2xl bg-slate-50 px-6 py-5" aria-label="목차">
              <p className="text-xs font-bold text-slate-400 mb-3">목차</p>
              <ol className="space-y-2 text-[15px]">
                {toc.map((t, i) => (
                  <li key={t.id + i}>
                    <a href={`#${t.id}`} className="text-slate-700 hover:text-blue-600">
                      {i + 1}. {t.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div className="mt-10">
            <BlogMarkdown content={post.content} />
          </div>

          {post.faq.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-5">자주 묻는 질문</h2>
              <div className="divide-y divide-slate-100 border-y border-slate-100">
                {post.faq.map((f, i) => (
                  <details key={i} className="group py-4">
                    <summary className="flex items-start justify-between gap-3 cursor-pointer list-none font-bold text-slate-900">
                      <span>Q. {f.q}</span>
                      <ChevronDown className="w-5 h-5 shrink-0 text-slate-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <p className="mt-3 text-[15px] text-slate-600 leading-relaxed whitespace-pre-wrap">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {post.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span key={t} className="px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-12">
            <BlogCta />
          </div>

          {related.length > 0 && (
            <section className="mt-16">
              <h2 className="text-xl font-extrabold text-slate-900 mb-6">다른 글</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-8">
                {related.map((p) => (
                  <BlogCard key={p.id} post={p} compact />
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
}
