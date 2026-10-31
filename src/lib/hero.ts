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
  /** 영상(mp4·webm) 또는 사진 주소 */
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
}

/** 기본 내장 오로라 영상 (public/hero) — 영상 배경인데 주소가 비어 있으면 이 영상 사용 */
export const BUNDLED_HERO_VIDEO = {
  desktop: "/hero/aurora-1080.mp4",
  mobile: "/hero/aurora-mobile.mp4",
  poster: "/hero/aurora-poster.jpg",
  mobilePoster: "/hero/aurora-poster-mobile.jpg",
};

export const DEFAULT_HERO: HeroConfig = {
  background: "video",
  auroraPreset: "northern",
  // 영상 자체에 별이 있어 기본은 끔
  stars: false,
  mediaUrl: "",
  posterUrl: "",
  overlay: 30,
  badge: "AI 여행 플래너 · 축제 · 현지 셰르파",
  titleLine1: "여행은,",
  titleHighlight: "길에서 시작됩니다",
  subtitle: "가고 싶은 곳만 알려주세요. AI가 동선·맛집·숙소까지 한 번에 짜드려요.",
  primaryLabel: "AI로 여행 일정 만들기",
  primaryHref: "/planner",
  secondaryLabel: "축제 보러 가기",
  secondaryHref: "/festivals",
  checks: ["무료로 시작", "동선 지도 제공", "축제 맞춤 일정", "현지 셰르파"],
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
  };
}
