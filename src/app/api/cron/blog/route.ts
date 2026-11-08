// 블로그 자동 작성 + 스레드 자동 게시 — Vercel Cron 이 매일 오전(KST 8시대) 호출 (vercel.json)
//
// 1) 블로그
//    - 설정이 '끄기'면 건너뜀
//    - 주당 횟수에 맞는 요일에만, 하루 한 번만 작성 (lastRunDate)
//    - 주제 목록 맨 위 주제를 쓰고 목록에서 뺌 (비어 있으면 AI가 주제 선택)
//    - '검토 후 발행' = 초안 저장 / '완전 자동' = 바로 발행
// 2) 스레드 8시 시간대 — src/lib/threads-auto.ts (하루 1~4개, 나머지 시간대는 /api/cron/threads/[slot])
// 보안: Vercel 환경변수 CRON_SECRET 이 있으면 'Authorization: Bearer <CRON_SECRET>' 필요 (Vercel Cron 이 자동으로 붙임)

import { revalidatePath } from "next/cache";
import { getAutoSettings, saveAutoSettings, isWritingDay, todayKst, type BlogAutoSettings } from "@/lib/blog-auto";
import { writeBlogPost, saveWrittenPost } from "@/lib/blog-writer";
import { runThreadsSlot } from "@/lib/threads-auto";

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

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const today = todayKst();
  const blog = await runBlog(await getAutoSettings(), today);
  // 스레드 8시 시간대 (하루 여러 개면 12·18·21시는 /api/cron/threads/[slot])
  const threads = await runThreadsSlot(8).catch((e) => ({ error: e instanceof Error ? e.message : String(e) }));
  return Response.json({ blog, threads });
}
