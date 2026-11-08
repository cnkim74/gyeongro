// AI 플래너 선택지 (플래너 화면 · 관리자 관심사 분석 공용)

export const PLANNER_THEMES = [
  { id: "food", label: "미식", emoji: "🍜" },
  { id: "nature", label: "자연", emoji: "🌿" },
  { id: "culture", label: "역사·문화", emoji: "🏛️" },
  { id: "activity", label: "액티비티", emoji: "🏄" },
  { id: "healing", label: "힐링", emoji: "🧘" },
  { id: "shopping", label: "쇼핑", emoji: "🛍️" },
  { id: "nightlife", label: "나이트라이프", emoji: "🌃" },
  { id: "photo", label: "인스타 명소", emoji: "📸" },
  { id: "movie_drama", label: "영화·드라마 촬영지", emoji: "🎬" },
  { id: "anime", label: "애니메이션 성지", emoji: "🌸" },
  { id: "bbang", label: "빵지순례", emoji: "🥐" },
  { id: "local_food", label: "로컬 푸드", emoji: "🍱" },
  { id: "camping", label: "캠핑", emoji: "🏕️" },
  { id: "golf", label: "골프", emoji: "⛳" },
  { id: "kpop", label: "K-POP 성지", emoji: "🎤" },
  { id: "pet", label: "펫 동반", emoji: "🐶" },
  { id: "honeymoon", label: "허니문", emoji: "💍" },
  { id: "hiking_trekking", label: "하이킹·트레킹", emoji: "🥾" },
  { id: "onsen", label: "온천·스파", emoji: "♨️" },
  { id: "roadtrip", label: "렌트카 여행", emoji: "🚗" },
  { id: "pilgrimage", label: "성지순례", emoji: "🛐" },
];

export const PLANNER_STYLES: Record<string, string> = {
  relaxed: "🧘 여유롭게",
  balanced: "⚖️ 적당히",
  packed: "🏃 빡빡하게",
};

export function themeLabel(id: string): string {
  const t = PLANNER_THEMES.find((x) => x.id === id);
  return t ? `${t.emoji} ${t.label}` : id;
}
