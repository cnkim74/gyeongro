// 다국어 자동 번역 (Groq Llama + DB 캐싱)
//
// 정책:
//   - 마스터 언어는 한국어 (ko). 모든 콘텐츠는 ko로 작성 → en/ja/zh 자동 생성
//   - DB 캐시: 동일 (text, target) 조합은 LLM 호출 안 함 → 비용 절감 + 일관성
//   - Groq Llama 3.1 8B Instant (무료 티어 + TPD 6M)
//   - 환경변수: GROQ_API_KEY 필수
//
// 사용:
//   import { translateText, translateBatch } from "@/lib/translate";
//   const en = await translateText(ko, "en");
//   const [en, ja, zh] = await translateBatch(ko, ["en", "ja", "zh"]);

import crypto from "node:crypto";
import Groq from "groq-sdk";
import { getSupabaseServiceClient } from "./supabase";

export type TargetLang = "en" | "ja" | "zh";
export type SourceLang = "ko" | TargetLang;

const LANG_NAMES: Record<SourceLang, string> = {
  ko: "Korean",
  en: "English",
  ja: "Japanese",
  zh: "Simplified Chinese",
};

const MODEL = "llama-3.1-8b-instant";

/** 안정적인 hash (sha256 prefix) */
function makeHash(text: string, sourceLang: SourceLang): string {
  return crypto
    .createHash("sha256")
    .update(`${sourceLang}|${text}`)
    .digest("hex")
    .slice(0, 32);
}

/** 캐시에서 조회 — 있으면 번역 결과 반환 */
async function lookupCache(
  text: string,
  sourceLang: SourceLang,
  targetLang: TargetLang
): Promise<string | null> {
  const supabase = getSupabaseServiceClient();
  const hash = makeHash(text, sourceLang);
  const { data } = await supabase
    .from("translations")
    .select("translated_text")
    .eq("source_hash", hash)
    .eq("source_lang", sourceLang)
    .eq("target_lang", targetLang)
    .maybeSingle();
  return data?.translated_text ?? null;
}

/** 캐시에 저장 — 충돌 시 덮어쓰지 않음(첫 결과 우선) */
async function saveCache(
  text: string,
  sourceLang: SourceLang,
  targetLang: TargetLang,
  translatedText: string
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const hash = makeHash(text, sourceLang);
  await supabase.from("translations").upsert(
    {
      source_hash: hash,
      source_lang: sourceLang,
      target_lang: targetLang,
      source_text: text,
      translated_text: translatedText,
      model: MODEL,
    },
    { onConflict: "source_hash,source_lang,target_lang", ignoreDuplicates: true }
  );
}

/** Groq로 실제 번역 호출 */
async function callLLM(
  text: string,
  sourceLang: SourceLang,
  targetLang: TargetLang
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY 환경변수가 설정되지 않았습니다.");

  const groq = new Groq({ apiKey });

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You are a professional translator. Translate from ${LANG_NAMES[sourceLang]} to ${LANG_NAMES[targetLang]}.
Rules:
- Output ONLY the translated text. No explanations, no quotes, no markdown.
- Preserve numbers, URLs, brand names, and proper nouns as-is.
- Keep the tone natural and idiomatic in the target language.
- If the input contains line breaks, preserve them.`,
      },
      { role: "user", content: text },
    ],
    max_tokens: 2000,
    temperature: 0.3,
  });

  return (completion.choices[0]?.message?.content ?? "").trim();
}

/**
 * 단일 텍스트 번역 (캐시 우선)
 * - 빈 입력 → 빈 문자열 반환
 * - 캐시 hit → 즉시 반환
 * - 캐시 miss → Gemini 호출 → 캐시 저장 → 반환
 */
export async function translateText(
  text: string,
  targetLang: TargetLang,
  sourceLang: SourceLang = "ko"
): Promise<string> {
  const trimmed = text?.trim();
  if (!trimmed) return "";
  if (sourceLang === targetLang) return trimmed;

  const cached = await lookupCache(trimmed, sourceLang, targetLang);
  if (cached) return cached;

  const translated = await callLLM(trimmed, sourceLang, targetLang);
  await saveCache(trimmed, sourceLang, targetLang, translated);
  return translated;
}

/** 한 텍스트를 여러 언어로 동시 번역 */
export async function translateBatch(
  text: string,
  targetLangs: TargetLang[],
  sourceLang: SourceLang = "ko"
): Promise<Record<TargetLang, string>> {
  const results = await Promise.all(
    targetLangs.map((lang) => translateText(text, lang, sourceLang))
  );
  const out: Record<string, string> = {};
  targetLangs.forEach((lang, i) => {
    out[lang] = results[i];
  });
  return out as Record<TargetLang, string>;
}

/** 배열 (예: cities) 번역 — 각 요소를 병렬로 */
export async function translateArray(
  items: string[],
  targetLang: TargetLang,
  sourceLang: SourceLang = "ko"
): Promise<string[]> {
  if (!items || items.length === 0) return [];
  return Promise.all(items.map((s) => translateText(s, targetLang, sourceLang)));
}

/** 셰르파 프로필 자동 번역 헬퍼 — tagline, bio, cities 한 번에 */
export async function translateSherpaProfile(input: {
  tagline?: string | null;
  bio?: string | null;
  cities?: string[] | null;
}): Promise<{
  tagline_en: string | null;
  tagline_ja: string | null;
  tagline_zh: string | null;
  bio_en: string | null;
  bio_ja: string | null;
  bio_zh: string | null;
  cities_en: string[] | null;
  cities_ja: string[] | null;
  cities_zh: string[] | null;
}> {
  const langs: TargetLang[] = ["en", "ja", "zh"];

  const [taglineMap, bioMap, citiesEn, citiesJa, citiesZh] = await Promise.all([
    input.tagline
      ? translateBatch(input.tagline, langs)
      : Promise.resolve({ en: "", ja: "", zh: "" } as Record<TargetLang, string>),
    input.bio
      ? translateBatch(input.bio, langs)
      : Promise.resolve({ en: "", ja: "", zh: "" } as Record<TargetLang, string>),
    input.cities ? translateArray(input.cities, "en") : Promise.resolve([]),
    input.cities ? translateArray(input.cities, "ja") : Promise.resolve([]),
    input.cities ? translateArray(input.cities, "zh") : Promise.resolve([]),
  ]);

  return {
    tagline_en: taglineMap.en || null,
    tagline_ja: taglineMap.ja || null,
    tagline_zh: taglineMap.zh || null,
    bio_en: bioMap.en || null,
    bio_ja: bioMap.ja || null,
    bio_zh: bioMap.zh || null,
    cities_en: citiesEn.length > 0 ? citiesEn : null,
    cities_ja: citiesJa.length > 0 ? citiesJa : null,
    cities_zh: citiesZh.length > 0 ? citiesZh : null,
  };
}
