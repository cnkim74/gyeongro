// 블로그 커버 — 사진이 있으면 사진, 없으면 글 제목으로 자동 디자인 (Pothos 브랜드)

import { coverGradient } from "@/lib/blog-utils";

export default function BlogCover({
  title,
  category,
  image,
  size = "card",
}: {
  title: string;
  category?: string;
  image?: string | null;
  size?: "card" | "hero";
}) {
  const hero = size === "hero";
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={title}
        loading={hero ? "eager" : "lazy"}
        className={`w-full h-full object-cover ${hero ? "rounded-3xl" : ""}`}
      />
    );
  }
  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-gradient-to-br ${coverGradient(title)} text-white flex flex-col justify-between ${
        hero ? "rounded-3xl p-5 sm:p-10" : "p-5"
      }`}
    >
      {/* 장식 원 */}
      <span className="absolute -right-16 -bottom-20 w-64 h-64 rounded-full bg-white/10" />
      <span className="absolute right-10 -top-10 w-32 h-32 rounded-full bg-white/5" />
      <p className={`relative font-extrabold tracking-tight ${hero ? "text-sm sm:text-base" : "text-xs"}`}>
        Pothos <span className="font-medium text-white/60 ml-1">여행 인사이트</span>
      </p>
      <div className="relative">
        {category && <p className={`text-white/70 mb-1 ${hero ? "text-sm" : "text-[10px]"}`}>#{category}</p>}
        <p className={`font-bold leading-snug line-clamp-3 ${hero ? "text-xl sm:text-3xl" : "text-[15px]"}`}>{title}</p>
      </div>
      <div className={`relative flex justify-between text-white/60 ${hero ? "text-sm" : "text-[10px]"}`}>
        <span>pothostravel.com/blog</span>
        <span>Pothos</span>
      </div>
    </div>
  );
}
