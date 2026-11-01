import Link from "next/link";
import BlogCover from "./BlogCover";
import { formatBlogDate, readMinutes } from "@/lib/blog-utils";
import type { BlogCard as Card } from "@/lib/blog";

export default function BlogCard({ post, compact = false }: { post: Card; compact?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block min-w-0">
      <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 shadow-sm group-hover:shadow-lg transition-shadow">
        <div className="w-full h-full group-hover:scale-[1.03] transition-transform duration-300">
          <BlogCover title={post.title} category={post.category} image={post.cover_image_url} coverStyle={post.cover_style} />
        </div>
      </div>
      <div className="mt-4">
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
          {post.category && <span className="font-semibold text-blue-600">#{post.category}</span>}
          <span>{formatBlogDate(post.published_at ?? post.created_at)}</span>
          <span>· {readMinutes(post.content)}분</span>
        </p>
        <h3
          className={`mt-1.5 font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors ${
            compact ? "text-[15px] line-clamp-2" : "text-lg line-clamp-2"
          }`}
        >
          {post.title}
        </h3>
        {!compact && post.excerpt && <p className="mt-2 text-sm text-slate-500 leading-relaxed line-clamp-2">{post.excerpt}</p>}
      </div>
    </Link>
  );
}
