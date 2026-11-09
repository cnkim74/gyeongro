// 스레드 자동 게시 (하루 1~4개) — 서버 전용
//
// 시간대(KST): 8시(블로그 예약 작업과 함께) · 12시 · 18시 · 21시 — 하루 게시 수에 따라 THREADS_SLOTS 사용
// 글감 순서
//   1) 아직 스레드에 안 올린 공개 블로그 글 (블로그 작성 때 만든 스레드 글 그대로)
//   2) (채우기 켬) 아직 공유 안 한 공개 스토리 → AI(Haiku)가 크리에이터 말투로 소개 글 작성
//   3) (채우기 켬) 이미 올린 블로그 글 속 여행 팁 하나 → AI가 짧게 정리 (같은 글은 30일에 한 번)
// 원칙: 글에 있는 내용만 쓰고 지어내지 않음, 직접 다녀온 척 금지

import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServiceClient } from "./supabase";
import { getAutoSettings, saveAutoSettings, todayKst, THREADS_SLOTS, type BlogAutoSettings } from "./blog-auto";
import { getThreadsConnection, refreshThreadsTokenIfNeeded, nextBlogForThreads, postBlogToThreads, publishToThreads } from "./threads";
import { aiMeter } from "./ai-runs";
import { threadsRules, type ThreadsVoiceKey } from "./threads-voice";

type Voice = { voice: ThreadsVoiceKey; custom: string };
const voiceOf = (s: BlogAutoSettings): Voice => ({ voice: s.threadsVoice, custom: s.threadsVoiceCustom });

const SITE = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://pothostravel.com").replace(/\/$/, "");
const MODEL = "claude-haiku-5-5";

export async function writeThreadsText(kind: "story" | "tip" | "blog", material: string, url: string, v: Voice): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY 없음");
  const meter = aiMeter(MODEL);
  const task =
    kind === "story"
      ? "아래 여행 스토리를 소개하는 글이에요. 스토리에서 가장 흥미로운 포인트 1~2개를 골라 주세요."
      : kind === "blog"
        ? "아래 블로그 글을 소개하는 글이에요. 읽고 싶어지게 핵심을 짚어 주세요."
        : "아래 블로그 글에서 실용적인 여행 팁 딱 하나만 골라, 그 팁을 중심으로 써 주세요. 글 전체 요약이 아니라 팁 하나에 집중.";
  let ok = false;
  try {
    const msg = await new Anthropic({ apiKey }).messages.create({
      model: MODEL,
      max_tokens: 800,
      output_config: { effort: "low" },
      messages: [
        {
          role: "user",
          content: `${task}\n\n아래 규칙으로 ${threadsRules(v.voice, v.custom).replaceAll("{URL}", url)}\n\n글만 출력하세요.\n\n[자료]\n${material.slice(0, 6000)}`,
        },
      ],
    });
    meter.add(msg.usage);
    const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    if (!text) throw new Error("빈 글");
    ok = true;
    return text.includes(url) ? text : `${text}\n\n${url}`;
  } finally {
    await meter.record("threads_text", null, ok, { kind });
  }
}

/** 아직 공유 안 한 공개 스토리 (최근 것부터) */
async function nextStory(shared: string[]) {
  const { data } = await getSupabaseServiceClient()
    .from("stories")
    .select("id, title, subtitle, destination, intro, sections, tags")
    .eq("is_published", true)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []).find((s) => !shared.includes(s.id as string)) ?? null;
}

/** 팁으로 쓸 블로그 글 (30일 안에 팁으로 쓴 글 제외, 오래된 것부터 골고루) */
async function nextTipPost(tipped: Record<string, string>) {
  const { data } = await getSupabaseServiceClient()
    .from("blog_posts")
    .select("id, slug, title, content")
    .eq("is_published", true)
    .order("published_at", { ascending: true })
    .limit(200);
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const candidates = (data ?? []).filter((p) => !tipped[p.id as string] || tipped[p.id as string] < cutoff);
  if (!candidates.length) return null;
  // 가장 오래전에 팁으로 쓴(또는 안 쓴) 글 먼저
  candidates.sort((a, b) => (tipped[a.id as string] ?? "").localeCompare(tipped[b.id as string] ?? ""));
  return candidates[0];
}

/** 기본 말투(친구 꿀팁)가 아니거나 추가 지시가 있으면, 블로그 작성 때 만든 스레드 글 대신 지금 말투로 새로 씀 */
export async function postBlogWithVoice(postId: string, settings?: BlogAutoSettings) {
  const s = settings ?? (await getAutoSettings());
  if (s.threadsVoice === "friend" && !s.threadsVoiceCustom) return postBlogToThreads(postId);
  const { data: p } = await getSupabaseServiceClient().from("blog_posts").select("slug, title, excerpt, content").eq("id", postId).maybeSingle();
  if (!p) return postBlogToThreads(postId);
  try {
    const url = `${SITE}/blog/${p.slug}`;
    const text = await writeThreadsText("blog", `제목: ${p.title}\n요약: ${p.excerpt ?? ""}\n\n${String(p.content ?? "")}`, url, voiceOf(s));
    return postBlogToThreads(postId, text);
  } catch {
    return postBlogToThreads(postId);
  }
}

/** 말투 미리보기 — 최근 공개 블로그 글로 시험 작성 (게시하지 않음) */
export async function previewThreadsText(v: Voice): Promise<{ text: string; title: string }> {
  const { data } = await getSupabaseServiceClient()
    .from("blog_posts")
    .select("slug, title, excerpt, content")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(1);
  const p = data?.[0];
  if (!p) throw new Error("공개된 블로그 글이 있어야 미리볼 수 있어요.");
  const url = `${SITE}/blog/${p.slug}`;
  const text = await writeThreadsText("blog", `제목: ${p.title}\n요약: ${p.excerpt ?? ""}\n\n${String(p.content ?? "")}`, url, v);
  return { text, title: p.title as string };
}

type SlotResult = { skipped?: string; ok?: boolean; source?: string; error?: string; threadsId?: string; token?: string };

/** 한 시간대 실행 — 예약 작업에서 호출 */
export async function runThreadsSlot(slot: number): Promise<SlotResult> {
  if (!(await getThreadsConnection())) return { skipped: "not-connected" };
  const token = await refreshThreadsTokenIfNeeded();
  const settings = await getAutoSettings();
  if (!settings.threadsAuto) return { skipped: "off", token };
  if (!THREADS_SLOTS[settings.threadsPerDay]?.includes(slot)) return { skipped: `slot-${slot}-not-used`, token };

  const today = todayKst();
  const done = settings.lastThreadsDate === today ? settings.threadsDoneSlots : [];
  if (done.includes(slot)) return { skipped: "already-posted-this-slot", token };

  // 먼저 이 시간대를 '했음'으로 기록 (예약 작업이 두 번 불려도 중복 게시 방지)
  const base: BlogAutoSettings = { ...settings, lastThreadsDate: today, threadsDoneSlots: [...done, slot] };
  await saveAutoSettings(base);

  // 1) 블로그 새 글
  const postId = await nextBlogForThreads();
  if (postId) {
    const r = await postBlogWithVoice(postId, settings);
    console.log(`[threads-cron] ${today} ${slot}시 blog ${r.ok ? r.threadsId : r.error}`);
    return { ...r, source: "blog", token };
  }
  if (!settings.threadsFill) return { skipped: "nothing-to-post", token };

  try {
    // 2) 스토리 공유
    const story = await nextStory(settings.threadsSharedStories);
    if (story) {
      const url = `${SITE}/stories/${story.id}`;
      const sections = (Array.isArray(story.sections) ? story.sections : []) as { title?: string; content?: string }[];
      const material = [
        `제목: ${story.title}`,
        story.subtitle ? `부제: ${story.subtitle}` : "",
        story.destination ? `여행지: ${story.destination}` : "",
        story.intro ?? "",
        ...sections.slice(0, 6).map((s) => `## ${s.title ?? ""}\n${String(s.content ?? "").slice(0, 700)}`),
      ].join("\n");
      const text = await writeThreadsText("story", material, url, voiceOf(settings));
      // 스토리 제목의 [Pothos 에디터] 같은 머리말은 링크 미리보기에 그대로 나와도 괜찮음
      const threadsId = await publishToThreads(text, url, { linkInReply: settings.threadsLinkInReply });
      await saveAutoSettings({ ...base, threadsSharedStories: [...settings.threadsSharedStories, story.id as string].slice(-300) });
      console.log(`[threads-cron] ${today} ${slot}시 story ${threadsId}`);
      return { ok: true, source: "story", threadsId, token };
    }

    // 3) 블로그 글 속 팁
    const tip = await nextTipPost(settings.threadsTipped);
    if (tip) {
      const url = `${SITE}/blog/${tip.slug}`;
      const text = await writeThreadsText("tip", `제목: ${tip.title}\n\n${String(tip.content ?? "")}`, url, voiceOf(settings));
      const threadsId = await publishToThreads(text, url, { linkInReply: settings.threadsLinkInReply });
      await saveAutoSettings({ ...base, threadsTipped: { ...settings.threadsTipped, [tip.id as string]: today } });
      console.log(`[threads-cron] ${today} ${slot}시 tip ${threadsId}`);
      return { ok: true, source: "tip", threadsId, token };
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.log(`[threads-cron] ${today} ${slot}시 failed: ${error}`);
    return { ok: false, error, token };
  }
  return { skipped: "nothing-to-post", token };
}
