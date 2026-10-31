// 메인 히어로 설정 — 관리자 페이지(/admin/hero)에서 수정
// 서버·클라이언트 공용 (타입·기본값·정리 함수만, 서버 전용 코드 없음)

export type HeroBackground = "aurora" | "video" | "image";
export type AuroraPreset = "northern" | "sunset" | "ocean";

export interface HeroConfig {
  background: HeroBackground;
  /** 오로라 색 조합 */
  auroraPreset: AuroraPreset;
  /** 반짝이는 별 표시 */
  stars: boolean;
  /** 영상(mp4·webm) 또는 사진 주소 — 사진 배경용 (영상은 videos 목록 사용) */
  mediaUrl: string;
  /** 영상 로딩 전 보여줄 사진 (선택) */
  posterUrl: string;
  /** 영상·사진 위 어둡게 덮는 정도 0~80 (%) */
  overlay: number;
  badge: string;
  titleLine1: string;
  titleHighlight: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  /** 하단 체크 문구 (최대 4개) */
  checks: string[];
  /** 관리자가 올린 히어로 영상 목록 — 방문할 때마다 랜덤 재생 (최대 10개) */
  videos: { url: string; poster: string }[];
  /** Pothos 기본 영상도 랜덤 후보에 포함 */
  includeBundled: boolean;
}

/** 히어로 영상 한 편 (PC·휴대폰용 주소와 포스터) */
export interface HeroVideoSources {
  desktop: string;
  mobile: string;
  poster?: string;
  mobilePoster?: string;
}

/**
 * Pothos 기본 내장 영상 (public/hero) — 방문할 때마다 이 중 하나를 랜덤 재생
 * 새 영상을 추가하면 이 목록에만 넣으면 됨
 */
export const BUNDLED_HERO_VIDEOS: HeroVideoSources[] = [
  {
    desktop: "/hero/aurora-1080.mp4",
    mobile: "/hero/aurora-mobile.mp4",
    poster: "/hero/aurora-poster.jpg",
    mobilePoster: "/hero/aurora-poster-mobile.jpg",
  },
  {
    desktop: "/hero/day-1080.mp4",
    mobile: "/hero/day-mobile.mp4",
    poster: "/hero/day-poster.jpg",
    mobilePoster: "/hero/day-poster-mobile.jpg",
  },
  // 노란 은행나무 길을 걷는 커플 (가을)
  {
    desktop: "/hero/ginkgo-1080.mp4",
    mobile: "/hero/ginkgo-mobile.mp4",
    poster: "/hero/ginkgo-poster.jpg",
    mobilePoster: "/hero/ginkgo-poster-mobile.jpg",
  },
  // 노을 빛줄기 아래 해변을 걷는 여행자
  {
    desktop: "/hero/beach-1080.mp4",
    mobile: "/hero/beach-mobile.mp4",
    poster: "/hero/beach-poster.jpg",
    mobilePoster: "/hero/beach-poster-mobile.jpg",
  },
];

/** 이번 방문에 재생할 영상 후보 목록 */
export function heroVideoOptions(c: HeroConfig): HeroVideoSources[] {
  const mine = c.videos.map((v) => ({ desktop: v.url, mobile: v.url, poster: v.poster || undefined }));
  const all = [...(c.includeBundled ? BUNDLED_HERO_VIDEOS : []), ...mine];
  return all.length > 0 ? all : BUNDLED_HERO_VIDEOS;
}

/** 월별 여행 시즌 문구 (히어로 상단 — 날짜에 맞춰 자동) */
export const MONTH_SEASONS: Record<number, { text: string; emoji: string }> = {
  1: { text: "겨울 눈꽃·온천 여행", emoji: "❄️" },
  2: { text: "겨울 축제·스키 시즌", emoji: "⛷️" },
  3: { text: "봄꽃 마중 여행", emoji: "🌱" },
  4: { text: "벚꽃·봄 축제 시즌", emoji: "🌸" },
  5: { text: "초록 여행·봄 축제", emoji: "🌿" },
  6: { text: "초여름 바다 여행", emoji: "🌊" },
  7: { text: "여름 휴가 시즌", emoji: "🏖️" },
  8: { text: "한여름 휴가·물놀이", emoji: "🏝️" },
  9: { text: "가을 여행의 시작", emoji: "🍂" },
  10: { text: "단풍·가을 축제 시즌", emoji: "🍁" },
  11: { text: "늦가을 단풍·축제", emoji: "🍁" },
  12: { text: "연말·겨울 여행", emoji: "🎄" },
};

export const DEFAULT_HERO: HeroConfig = {
  background: "video",
  auroraPreset: "northern",
  // 영상 자체에 별이 있어 기본은 끔
  stars: false,
  mediaUrl: "",
  posterUrl: "",
  overlay: 35,
  badge: "그럴듯한 답변이 아닌, 실제로 갈 수 있는 여행",
  titleLine1: "여행은,",
  titleHighlight: "길에서 시작됩니다",
  subtitle: "지도에서 확인한 실제 장소, 공식 축제·여행경보 데이터로 바로 떠날 수 있는 일정을 짜드려요.",
  primaryLabel: "AI로 여행 일정 만들기",
  primaryHref: "/planner",
  secondaryLabel: "축제 보러 가기",
  secondaryHref: "/festivals",
  checks: ["실제 장소 지도 확인", "동선·길찾기 연결", "공식 축제 데이터", "외교부 여행경보"],
  videos: [],
  includeBundled: true,
};

export const AURORA_PRESETS: Record<AuroraPreset, { label: string; base: string; colors: [string, string, string, string] }> = {
  northern: {
    label: "북극 오로라 (초록·청록)",
    base: "linear-gradient(180deg, #020617 0%, #0b1530 55%, #111c44 100%)",
    colors: ["#22d3ee", "#34d399", "#818cf8", "#a78bfa"],
  },
  sunset: {
    label: "노을 오로라 (핑크·보라)",
    base: "linear-gradient(180deg, #0f0720 0%, #2a0f3d 55%, #3b1240 100%)",
    colors: ["#f472b6", "#fb923c", "#c084fc", "#f43f5e"],
  },
  ocean: {
    label: "바다 오로라 (파랑·하늘)",
    base: "linear-gradient(180deg, #020617 0%, #082f49 55%, #0c4a6e 100%)",
    colors: ["#38bdf8", "#22d3ee", "#60a5fa", "#2dd4bf"],
  },
};

function str(v: unknown, max: number, fallback: string): string {
  return typeof v === "string" ? v.slice(0, max) : fallback;
}

/** 내부 경로(/...) 또는 http(s) 주소만 허용 */
function safeHref(v: unknown, fallback: string): string {
  if (typeof v !== "string") return fallback;
  const t = v.trim();
  return /^\/(?!\/)/.test(t) || /^https?:\/\//.test(t) ? t.slice(0, 300) : fallback;
}

function safeMedia(v: unknown): string {
  if (typeof v !== "string") return "";
  const t = v.trim();
  return /^https:\/\//.test(t) || /^\/(?!\/)/.test(t) ? t.slice(0, 500) : "";
}

/** 저장·불러오기 시 값 정리 (모르는 값은 기본값으로) */
export function normalizeHero(input: unknown): HeroConfig {
  const v = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const d = DEFAULT_HERO;
  const background: HeroBackground =
    v.background === "video" || v.background === "image" || v.background === "aurora" ? v.background : d.background;
  const auroraPreset: AuroraPreset =
    v.auroraPreset === "sunset" || v.auroraPreset === "ocean" ? v.auroraPreset : "northern";
  const overlay = Math.min(80, Math.max(0, Math.round(Number(v.overlay ?? d.overlay)) || 0));
  // 영상 목록 (예전 설정의 단일 mediaUrl 영상도 목록으로 옮김)
  let videos: HeroConfig["videos"] = Array.isArray(v.videos)
    ? (v.videos as unknown[])
        .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
        .map((x) => ({ url: safeMedia(x.url), poster: safeMedia(x.poster) }))
        .filter((x) => x.url)
        .slice(0, 10)
    : [];
  if (videos.length === 0 && background === "video" && safeMedia(v.mediaUrl)) {
    videos = [{ url: safeMedia(v.mediaUrl), poster: safeMedia(v.posterUrl) }];
  }
  const checks = Array.isArray(v.checks)
    ? v.checks.filter((c): c is string => typeof c === "string" && !!c.trim()).map((c) => c.slice(0, 20)).slice(0, 4)
    : d.checks;
  return {
    background,
    auroraPreset,
    stars: typeof v.stars === "boolean" ? v.stars : d.stars,
    mediaUrl: safeMedia(v.mediaUrl),
    posterUrl: safeMedia(v.posterUrl),
    overlay,
    badge: str(v.badge, 40, d.badge),
    titleLine1: str(v.titleLine1, 30, d.titleLine1),
    titleHighlight: str(v.titleHighlight, 30, d.titleHighlight),
    subtitle: str(v.subtitle, 120, d.subtitle),
    primaryLabel: str(v.primaryLabel, 24, d.primaryLabel) || d.primaryLabel,
    primaryHref: safeHref(v.primaryHref, d.primaryHref),
    secondaryLabel: str(v.secondaryLabel, 24, d.secondaryLabel),
    secondaryHref: safeHref(v.secondaryHref, d.secondaryHref),
    checks,
    videos,
    includeBundled: typeof v.includeBundled === "boolean" ? v.includeBundled : true,
  };
}
