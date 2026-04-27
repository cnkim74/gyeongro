// 셰르파 도메인 상수 — 전문 분야 / 언어 / 헬퍼

export interface SherpaSpecialty {
  id: string;
  label: string;
  emoji: string;
}

export const SHERPA_SPECIALTIES: SherpaSpecialty[] = [
  { id: "city_guide", label: "도시 가이드", emoji: "🗺️" },
  { id: "interpreter", label: "통역", emoji: "💬" },
  { id: "food_tour", label: "푸드 투어", emoji: "🍜" },
  { id: "photographer", label: "사진가", emoji: "📷" },
  { id: "shopping", label: "쇼핑 도우미", emoji: "🛍️" },
  { id: "medical_concierge", label: "의료 통역·동행", emoji: "🏥" },
  { id: "transport", label: "차량·동행", emoji: "🚗" },
  { id: "tradition", label: "전통·문화체험", emoji: "🏛️" },
];

export const SPECIALTY_BY_ID = Object.fromEntries(
  SHERPA_SPECIALTIES.map((s) => [s.id, s])
) as Record<string, SherpaSpecialty>;

export interface Language {
  code: string;
  label: string;
  emoji: string;
}

export const LANGUAGES: Language[] = [
  { code: "ko", label: "한국어", emoji: "🇰🇷" },
  { code: "en", label: "English", emoji: "🇺🇸" },
  { code: "ja", label: "日本語", emoji: "🇯🇵" },
  { code: "zh", label: "中文", emoji: "🇨🇳" },
  { code: "es", label: "Español", emoji: "🇪🇸" },
  { code: "fr", label: "Français", emoji: "🇫🇷" },
  { code: "de", label: "Deutsch", emoji: "🇩🇪" },
  { code: "th", label: "ภาษาไทย", emoji: "🇹🇭" },
  { code: "vi", label: "Tiếng Việt", emoji: "🇻🇳" },
  { code: "tr", label: "Türkçe", emoji: "🇹🇷" },
  { code: "ru", label: "Русский", emoji: "🇷🇺" },
  { code: "ar", label: "العربية", emoji: "🇸🇦" },
];

export const LANGUAGE_BY_CODE = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l])
) as Record<string, Language>;

export const COUNTRY_FLAGS: Record<string, string> = {
  KR: "🇰🇷",
  JP: "🇯🇵",
  TR: "🇹🇷",
  TH: "🇹🇭",
  FR: "🇫🇷",
  IT: "🇮🇹",
  ES: "🇪🇸",
  DE: "🇩🇪",
  US: "🇺🇸",
  GB: "🇬🇧",
  CN: "🇨🇳",
  TW: "🇹🇼",
  VN: "🇻🇳",
  HU: "🇭🇺",
  CZ: "🇨🇿",
  MY: "🇲🇾",
};

export interface SherpaListItem {
  slug: string;
  display_name: string;
  tagline: string | null;
  countries: string[];
  cities: string[];
  languages: string[];
  specialties: string[];
  hourly_rate_krw: number | null;
  half_day_rate_krw: number | null;
  full_day_rate_krw: number | null;
  rating_avg: number | null;
  rating_count: number;
  booking_count: number;
  avatar_url: string | null;
  cover_image_url: string | null;
}

export function formatRate(value: number | null): string {
  if (!value) return "-";
  if (value >= 10000) return `${(value / 10000).toFixed(value % 10000 === 0 ? 0 : 1)}만원`;
  return `${value.toLocaleString("ko-KR")}원`;
}

export const NICKNAME_RE = /^[A-Za-z0-9가-힣 ]{2,30}$/;
