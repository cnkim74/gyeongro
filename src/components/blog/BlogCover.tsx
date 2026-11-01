// 블로그 대표 이미지
// - 사진 + 템플릿 색(cover_style) → 사진 위에 색을 덮고 제목을 얹은 카드 (참고: C&BIZ 인사이트)
// - 사진만 → 사진 그대로
// - 사진 없음 → 템플릿 색(없으면 제목으로 정한 색) 배경 카드

import { COVER_STYLES, coverGradient } from "@/lib/blog-utils";

export default function BlogCover({
  title,
  category,
  image,
  coverStyle,
  size = "card",
}: {
  title: string;
  category?: string;
  image?: string | null;
  coverStyle?: string | null;
  size?: "card" | "hero";
}) {
  const hero = size === "hero";
  const style = coverStyle ? COVER_STYLES[coverStyle] : undefined;

  if (image && !style) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt={title} loading={hero ? "eager" : "lazy"} className={`w-full h-full object-cover ${hero ? "rounded-3xl" : ""}`} />
    );
  }

  const bg = style
    ? image
      ? { background: `linear-gradient(120deg, ${style.from}e6 0%, ${style.to}b3 55%, ${style.to}66 100%)` }
      : { background: `linear-gradient(135deg, ${style.from} 0%, ${style.to} 100%)` }
    : undefined;

  return (
    <div className={`relative w-full h-full overflow-hidden text-white ${hero ? "rounded-3xl" : ""} ${!style ? `bg-gradient-to-br ${coverGradient(title)}` : ""}`}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" loading={hero ? "eager" : "lazy"} className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0" style={bg} />
      {!image && (
        <>
          <span className="absolute -right-16 -bottom-20 w-64 h-64 rounded-full bg-white/10" />
          <span className="absolute right-10 -top-10 w-32 h-32 rounded-full bg-white/5" />
        </>
      )}
      <div className={`relative h-full flex flex-col justify-between ${hero ? "p-5 sm:p-10" : "p-5"}`}>
        <p className={`font-extrabold tracking-tight ${hero ? "text-sm sm:text-base" : "text-xs"}`}>
          Pothos <span className="font-medium text-white/60 ml-1">여행 인사이트</span>
        </p>
        <div>
          {category && <p className={`text-white/75 mb-1 font-semibold ${hero ? "text-sm" : "text-[10px]"}`}>#{category}</p>}
          <p className={`font-bold leading-snug line-clamp-3 drop-shadow-sm ${hero ? "text-xl sm:text-3xl" : "text-[15px]"}`}>{title}</p>
        </div>
        <div className={`flex justify-between text-white/60 ${hero ? "text-sm" : "text-[10px]"}`}>
          <span>pothostravel.com/blog</span>
          <span>Pothos</span>
        </div>
      </div>
    </div>
  );
}
