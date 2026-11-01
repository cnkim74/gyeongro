// 블로그 AI 자동 작성 설정 — 서버 전용
// DB 테이블 없이 Supabase Storage 'site-media/config/blog-auto.json' 에 저장 (히어로 설정과 같은 방식)

import { getSupabaseServiceClient } from "./supabase";
import { isCoverStyle } from "./blog-utils";

const BUCKET = "site-media";
const PATH = "config/blog-auto.json";

export type AutoMode = "off" | "review" | "auto";

export interface BlogAutoSettings {
  /** off: 자동 작성 안 함 / review: 초안 저장 후 확인하고 발행 / auto: 바로 발행 */
  mode: AutoMode;
  /** 주당 작성 횟수 1~7 */
  perWeek: number;
  /** 블로그 컨셉 — AI에게 주는 방향 */
  concept: string;
  /** 다음에 쓸 주제 목록 (위에서부터 하나씩 사용, 비면 AI가 선택) */
  topics: string[];
  /** 대표 이미지: AI가 글마다 색 선택 / 항상 기본 색 */
  coverMode: "ai" | "fixed";
  coverStyle: string;
  /** 위키미디어 공용 무료 사진(출처 표기) 자동 삽입 */
  photos: boolean;
  /** 마지막 자동 작성일 (KST, YYYY-MM-DD) — 하루 한 번만 */
  lastRunDate: string | null;
}

export const DEFAULT_CONCEPT =
  "Pothos 여행 인사이트: 한국인 자유여행자가 실제로 검색하는 여행 정보(여행지 고르기, 시기·날씨, 일정·동선, 예산, 교통·교통카드, 축제, 준비물, 출입국)를 직접 다녀온 사람처럼 쉽고 구체적으로 정리. 과장 없이 실용적으로, 마지막엔 Pothos AI 플래너로 일정을 만들어 보도록 자연스럽게 안내.";

export const DEFAULT_AUTO: BlogAutoSettings = {
  mode: "off",
  perWeek: 3,
  concept: DEFAULT_CONCEPT,
  topics: [],
  coverMode: "ai",
  coverStyle: "midnight",
  photos: true,
  lastRunDate: null,
};

export function normalizeAuto(input: unknown): BlogAutoSettings {
  const v = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const mode: AutoMode = v.mode === "review" || v.mode === "auto" ? v.mode : "off";
  const perWeek = Math.min(7, Math.max(1, Math.round(Number(v.perWeek ?? DEFAULT_AUTO.perWeek)) || 3));
  const topics = (Array.isArray(v.topics) ? v.topics : typeof v.topics === "string" ? v.topics.split("\n") : [])
    .map((t) => String(t).trim())
    .filter(Boolean)
    .map((t) => t.slice(0, 100))
    .slice(0, 50);
  return {
    mode,
    perWeek,
    concept: typeof v.concept === "string" && v.concept.trim() ? v.concept.trim().slice(0, 1000) : DEFAULT_CONCEPT,
    topics,
    coverMode: v.coverMode === "fixed" ? "fixed" : "ai",
    coverStyle: isCoverStyle(v.coverStyle) ? v.coverStyle : "midnight",
    photos: typeof v.photos === "boolean" ? v.photos : true,
    lastRunDate: typeof v.lastRunDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.lastRunDate) ? v.lastRunDate : null,
  };
}

export async function getAutoSettings(): Promise<BlogAutoSettings> {
  try {
    const { data, error } = await getSupabaseServiceClient().storage.from(BUCKET).download(PATH);
    if (error || !data) return DEFAULT_AUTO;
    return normalizeAuto(JSON.parse(await data.text()));
  } catch {
    return DEFAULT_AUTO;
  }
}

export async function saveAutoSettings(input: unknown): Promise<BlogAutoSettings> {
  const s = normalizeAuto(input);
  const supabase = getSupabaseServiceClient();
  const { data: bucket } = await supabase.storage.getBucket(BUCKET);
  if (!bucket) await supabase.storage.createBucket(BUCKET, { public: true });
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(PATH, new Blob([JSON.stringify(s, null, 2)], { type: "application/json" }), {
      upsert: true,
      contentType: "application/json",
      cacheControl: "0",
    });
  if (error) throw new Error(error.message);
  return s;
}

/** KST 오늘 (YYYY-MM-DD) */
export function todayKst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

/** 주당 횟수 → 글 쓰는 요일 (0=일 … 6=토) */
const WEEK_PLAN: Record<number, number[]> = {
  1: [1],
  2: [2, 5],
  3: [1, 3, 5],
  4: [1, 2, 4, 6],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
  7: [0, 1, 2, 3, 4, 5, 6],
};

export function isWritingDay(perWeek: number, date = new Date()): boolean {
  const dow = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", weekday: "short" })
      .formatToParts(date)
      .find((p) => p.type === "weekday")
      ?.value.replace(/^(\w{3}).*/, "$1")
      .replace("Sun", "0")
      .replace("Mon", "1")
      .replace("Tue", "2")
      .replace("Wed", "3")
      .replace("Thu", "4")
      .replace("Fri", "5")
      .replace("Sat", "6")
  );
  return (WEEK_PLAN[perWeek] ?? WEEK_PLAN[3]).includes(dow);
}

export function writingDaysLabel(perWeek: number): string {
  const names = ["일", "월", "화", "수", "목", "금", "토"];
  return (WEEK_PLAN[perWeek] ?? []).map((d) => names[d]).join("·");
}
