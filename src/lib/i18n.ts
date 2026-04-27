// 다국어 지원 — 쿠키 기반 locale 전환
//
// 사용처:
//   - 서버 컴포넌트: const locale = await getLocale();
//                    const t = createTranslator(locale);
//   - 클라이언트 컴포넌트: const { locale, t } = useI18n();
//
// 폴백: 영어 번역 누락 시 한국어, 한국어도 누락 시 키 그대로

import { cookies } from "next/headers";
import { messages, type MessageKey } from "@/messages";

export type Locale = "ko" | "en" | "ja" | "zh";
export const SUPPORTED_LOCALES: Locale[] = ["ko", "en", "ja", "zh"];
export const DEFAULT_LOCALE: Locale = "ko";
export const LOCALE_COOKIE = "pothos_locale";

export function isLocale(s: string | undefined | null): s is Locale {
  return s === "ko" || s === "en" || s === "ja" || s === "zh";
}

/** 서버 컴포넌트에서 현재 locale 조회 */
export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const v = c.get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

/** 번역 함수 생성 — 누락 시 한국어 → 키 폴백 */
export function createTranslator(locale: Locale) {
  return function t(key: MessageKey): string {
    const m = messages[locale] as Record<string, string>;
    if (m[key]) return m[key];
    const fallback = messages.ko as Record<string, string>;
    return fallback[key] ?? key;
  };
}

/** DB 컬럼 폴백 헬퍼 — locale 컬럼 → en → ko */
export function pickLocalized<T extends Record<string, unknown>>(
  obj: T,
  baseField: string,
  locale: Locale
): string | null {
  if (locale !== "ko") {
    // locale 전용 컬럼 (예: name_ja, name_zh)
    const localized = obj[`${baseField}_${locale}`] as string | null | undefined;
    if (localized && localized.trim()) return localized;
    // ja/zh는 영문으로 폴백 (ko 가 아닌 외국어 사용자에게 영문이 더 친숙)
    if (locale !== "en") {
      const en = obj[`${baseField}_en`] as string | null | undefined;
      if (en && en.trim()) return en;
    } else {
      const en = obj[`${baseField}_en`] as string | null | undefined;
      if (en && en.trim()) return en;
    }
  }
  const ko = obj[baseField] as string | null | undefined;
  return ko ?? null;
}
