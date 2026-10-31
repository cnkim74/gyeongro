// 커뮤니티 '첫 글 이벤트' — 진짜 첫 글을 모으기 위한 보상
//
// 회원이 처음으로 여행 후기·꿀팁·질문·유튜브 공유·스토리를 올리면 AI 플래너 이용권을 자동 지급.
// - 계정당 1회 (ai_credits.source = 'event_first_post' 존재 여부로 판단)
// - 너무 짧은 글은 제외 (본문 30자 이상, 유튜브 게시판은 영상·채널 주소가 있으면 인정)
// - 기간·보상량은 아래 설정만 바꾸면 됨

import { getSupabaseServiceClient } from "./supabase";

export const FIRST_POST_EVENT = {
  /** 이벤트 마지막 날 (KST, 이 날짜 23:59 까지) */
  endsOn: "2026-12-31",
  /** 지급할 AI 플래너 이용 횟수 */
  reward: 3,
  /** 이용권 유효기간 (일) */
  validDays: 90,
  /** 대상 게시판 */
  boards: ["free", "tip", "question", "youtube"],
  minLength: 30,
  source: "event_first_post",
};

export function isFirstPostEventActive(now = new Date()): boolean {
  const kstToday = new Date(now.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  return kstToday <= FIRST_POST_EVENT.endsOn;
}

/** 이벤트 기간 표기 (예: "12월 31일까지") */
export function firstPostEventDeadline(): string {
  const [, m, d] = FIRST_POST_EVENT.endsOn.split("-").map(Number);
  return `${m}월 ${d}일까지`;
}

/**
 * 조건에 맞으면 이용권 지급. 지급했으면 지급 횟수, 아니면 0 반환.
 * 실패해도 글 등록 자체에는 영향 주지 않음.
 */
export async function grantFirstPostReward(
  userId: string,
  opts: { boardSlug?: string | null; content: string; isStory?: boolean }
): Promise<number> {
  try {
    if (!isFirstPostEventActive()) return 0;
    if (!opts.isStory && !FIRST_POST_EVENT.boards.includes(opts.boardSlug ?? "")) return 0;

    const text = opts.content.replace(/\s+/g, " ").trim();
    const hasYouTube = /youtu\.?be/.test(text);
    if (!(text.length >= FIRST_POST_EVENT.minLength || (opts.boardSlug === "youtube" && hasYouTube))) return 0;

    const supabase = getSupabaseServiceClient();
    const { data: already } = await supabase
      .from("ai_credits")
      .select("id")
      .eq("user_id", userId)
      .eq("source", FIRST_POST_EVENT.source)
      .limit(1);
    if (already && already.length > 0) return 0;

    const expires = new Date(Date.now() + FIRST_POST_EVENT.validDays * 86400000).toISOString();
    const { error } = await supabase.from("ai_credits").insert({
      user_id: userId,
      action: "planner",
      remaining: FIRST_POST_EVENT.reward,
      granted: FIRST_POST_EVENT.reward,
      source: FIRST_POST_EVENT.source,
      expires_at: expires,
    });
    if (error) {
      console.log(`[event] first-post grant failed: ${error.message}`);
      return 0;
    }
    return FIRST_POST_EVENT.reward;
  } catch (e) {
    console.log(`[event] first-post error: ${e instanceof Error ? e.message : e}`);
    return 0;
  }
}
