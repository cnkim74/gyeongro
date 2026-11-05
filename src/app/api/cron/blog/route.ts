// 블로그 자동 작성 + 스레드 자동 게시 — Vercel Cron 이 매일 오전(KST 8시대) 호출 (vercel.json)
//
// 1) 블로그
//    - 설정이 '끄기'면 건너뜀
//    - 주당 횟수에 맞는 요일에만, 하루 한 번만 작성 (lastRunDate)
//    - 주제 목록 맨 위 주제를 쓰고 목록에서 뺌 (비어 있으면 AI가 주제 선택)
//    - '검토 후 발행' = 초안 저장 / '완전 자동' = 바로 발행
// 2) 스레드 (연결돼 있고 '자동 게시'를 켰을 때)
//    - 토큰 만료 15일 전부터 자동 갱신
//    - 아직 안 올린 공개 글 중 가장 최근 것 1개를 하루 한 번 게시 (lastThreadsDate)
// 보안: Vercel 환경변수 CRON_SECRET 이 있으면 'Authorization: Bearer <CRON_SECRET>' 필요 (Vercel Cron 이 자동으로 붙임)

import { revalidatePath } from "next/cache";
import { getAutoSettings, saveAutoSettings, isWritingDay, todayKst, type BlogAutoSettings } from "@/lib/blog-auto";
import { writeBlogPost, saveWrittenPost } from "@/lib/blog-writer";
import { getThreadsConnection, refreshThreadsTokenIfNeeded, nextBlogForThreads, postBlogToThreads } from "@/lib/threads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function runBlog(settings: BlogAutoSettings, today: string) {
  if (settings.mode === "off") return { skipped: "off" };
  if (!isWritingDay(settings.perWeek)) return { skipped: "not-writing-day" };
  if (settings.lastRunDate === today) return { skipped: "already-ran-today" };

  // 먼저 오늘 실행 표시 + 주제 하나 꺼내기 (중복 실행 방지)
  const [topic, ...rest] = settings.topics;
  await saveAutoSettings({ ...settings, topics: rest, lastRunDate: today });
  try {
    const post = await writeBlogPost({ topic, settings });
    const publish = settings.mode === "auto";
    const saved = await saveWrittenPost(post, { publish });
    revalidatePath("/blog", "layout");
    console.log(`[blog-cron] ${today} ${publish ? "published" : "draft"} ${saved.slug}`);
    return { ok: true, ...saved, published: publish };
  } catch (e) {
    // 실패하면 주제를 목록에 되돌림 (다음 작성일에 다시 시도)
    await saveAutoSettings({ ...settings, topics: settings.topics, lastRunDate: today });
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`[blog-cron] ${today} failed: ${msg}`);
    return { error: msg };
  }
}

async function runThreads(today: string) {
  if (!(await getThreadsConnection())) return { skipped: "not-connected" };
  const token = await refreshThreadsTokenIfNeeded();
  const settings = await getAutoSettings(); // 블로그 단계에서 바뀐 값을 다시 읽음
  if (!settings.threadsAuto) return { skipped: "off", token };
  if (settings.lastThreadsDate === today) return { skipped: "already-posted-today", token };
  const postId = await nextBlogForThreads();
  if (!postId) return { skipped: "nothing-to-post", token };
  await saveAutoSettings({ ...settings, lastThreadsDate: today });
  const r = await postBlogToThreads(postId);
  console.log(`[threads-cron] ${today} ${r.ok ? `posted ${r.threadsId}` : `failed: ${r.error}`}`);
  return { ...r, token };
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const today = todayKst();
  const blog = await runBlog(await getAutoSettings(), today);
  const threads = await runThreads(today).catch((e) => ({ error: e instanceof Error ? e.message : String(e) }));
  return Response.json({ blog, threads });
}
