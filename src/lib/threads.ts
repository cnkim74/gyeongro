// 스레드(Threads) 자동 게시 — 서버 전용 (Meta 공식 Threads API)
//
// 필요한 Vercel 환경변수: THREADS_APP_ID, THREADS_APP_SECRET  (Meta 개발자 앱의 Threads 앱 ID·시크릿)
// 연결 정보(액세스 토큰)는 Supabase Storage 의 비공개 버킷 'private-config/threads.json' 에 저장
//   - 공개 버킷이 아니라 서비스 키로만 읽을 수 있음
//   - 장기 토큰은 60일 → 만료 15일 전부터 자동 갱신(매일 예약 작업)
// 게시: 텍스트(최대 500자) + 링크 미리보기

import { getSupabaseServiceClient } from "./supabase";

const BUCKET = "private-config";
const PATH = "threads.json";
const GRAPH = "https://graph.threads.net";
const SITE = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://pothostravel.com").replace(/\/$/, "");

export const THREADS_REDIRECT = `${SITE}/api/admin/threads/callback`;

export interface ThreadsConnection {
  userId: string;
  username: string;
  accessToken: string;
  expiresAt: string; // ISO
  connectedAt: string;
}

export function threadsAppConfigured(): boolean {
  return !!(process.env.THREADS_APP_ID && process.env.THREADS_APP_SECRET);
}

async function ensureBucket() {
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) await supabase.storage.createBucket(BUCKET, { public: false });
}

export async function getThreadsConnection(): Promise<ThreadsConnection | null> {
  try {
    const { data, error } = await getSupabaseServiceClient().storage.from(BUCKET).download(PATH);
    if (error || !data) return null;
    const j = JSON.parse(await data.text()) as ThreadsConnection;
    return j.accessToken && j.userId ? j : null;
  } catch {
    return null;
  }
}

async function saveConnection(c: ThreadsConnection | null) {
  await ensureBucket();
  const storage = getSupabaseServiceClient().storage.from(BUCKET);
  if (!c) {
    await storage.remove([PATH]);
    return;
  }
  const { error } = await storage.upload(PATH, new Blob([JSON.stringify(c)], { type: "application/json" }), {
    upsert: true,
    contentType: "application/json",
    cacheControl: "0",
  });
  if (error) throw new Error(error.message);
}

export async function disconnectThreads() {
  await saveConnection(null);
}

/** 연결 화면 정보 (토큰 값은 절대 화면에 보내지 않음) */
export async function threadsStatus() {
  const c = await getThreadsConnection();
  return {
    appConfigured: threadsAppConfigured(),
    connected: !!c,
    username: c?.username ?? null,
    expiresAt: c?.expiresAt ?? null,
  };
}

export function threadsAuthorizeUrl(state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.THREADS_APP_ID ?? "",
    redirect_uri: THREADS_REDIRECT,
    scope: "threads_basic,threads_content_publish",
    response_type: "code",
    state,
  });
  return `https://threads.net/oauth/authorize?${p}`;
}

/** OAuth 코드 → 단기 토큰 → 60일 장기 토큰 → 저장 */
export async function completeThreadsAuth(code: string): Promise<ThreadsConnection> {
  const appId = process.env.THREADS_APP_ID!;
  const secret = process.env.THREADS_APP_SECRET!;
  const r1 = await fetch(`${GRAPH}/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: appId,
      client_secret: secret,
      grant_type: "authorization_code",
      redirect_uri: THREADS_REDIRECT,
      code,
    }),
  });
  const short = (await r1.json()) as { access_token?: string; user_id?: string | number; error_message?: string; error?: { message?: string } };
  if (!short.access_token) throw new Error(short.error_message ?? short.error?.message ?? "스레드 인증 실패");

  const r2 = await fetch(
    `${GRAPH}/access_token?grant_type=th_exchange_token&client_secret=${encodeURIComponent(secret)}&access_token=${encodeURIComponent(short.access_token)}`
  );
  const long = (await r2.json()) as { access_token?: string; expires_in?: number; error?: { message?: string } };
  if (!long.access_token) throw new Error(long.error?.message ?? "장기 토큰 발급 실패");

  const r3 = await fetch(`${GRAPH}/v1.0/me?fields=id,username&access_token=${encodeURIComponent(long.access_token)}`);
  const me = (await r3.json()) as { id?: string; username?: string };

  const conn: ThreadsConnection = {
    userId: String(me.id ?? short.user_id ?? ""),
    username: me.username ?? "",
    accessToken: long.access_token,
    expiresAt: new Date(Date.now() + (long.expires_in ?? 60 * 86400) * 1000).toISOString(),
    connectedAt: new Date().toISOString(),
  };
  if (!conn.userId) throw new Error("스레드 계정 정보를 가져오지 못했어요.");
  await saveConnection(conn);
  return conn;
}

/** 만료 15일 전부터 토큰 갱신 (매일 예약 작업에서 호출) */
export async function refreshThreadsTokenIfNeeded(): Promise<"refreshed" | "ok" | "none" | "failed"> {
  const c = await getThreadsConnection();
  if (!c) return "none";
  if (new Date(c.expiresAt).getTime() - Date.now() > 15 * 86400 * 1000) return "ok";
  try {
    const r = await fetch(`${GRAPH}/refresh_access_token?grant_type=th_refresh_token&access_token=${encodeURIComponent(c.accessToken)}`);
    const j = (await r.json()) as { access_token?: string; expires_in?: number };
    if (!j.access_token) return "failed";
    await saveConnection({ ...c, accessToken: j.access_token, expiresAt: new Date(Date.now() + (j.expires_in ?? 60 * 86400) * 1000).toISOString() });
    return "refreshed";
  } catch {
    return "failed";
  }
}

/** 스레드에 글 올리기 (텍스트 + 링크 미리보기). 성공하면 게시물 id */
export async function publishToThreads(text: string, link?: string): Promise<string> {
  const c = await getThreadsConnection();
  if (!c) throw new Error("스레드 계정이 연결되지 않았어요.");
  // 500자 제한 — 넘치면 링크를 남기고 앞부분을 줄임
  let body = text.trim();
  if (body.length > 500) {
    const tail = link && body.includes(link) ? `\n${link}` : "";
    body = body.replace(link ?? "\u0000", "").slice(0, 500 - tail.length - 1).trimEnd() + "…" + tail;
  }
  const params = new URLSearchParams({ media_type: "TEXT", text: body, access_token: c.accessToken });
  if (link) params.set("link_attachment", link);
  const r1 = await fetch(`${GRAPH}/v1.0/${c.userId}/threads`, { method: "POST", body: params });
  const created = (await r1.json()) as { id?: string; error?: { message?: string } };
  if (!created.id) throw new Error(created.error?.message ?? "스레드 게시물 만들기 실패");

  const r2 = await fetch(`${GRAPH}/v1.0/${c.userId}/threads_publish`, {
    method: "POST",
    body: new URLSearchParams({ creation_id: created.id, access_token: c.accessToken }),
  });
  const published = (await r2.json()) as { id?: string; error?: { message?: string } };
  if (!published.id) throw new Error(published.error?.message ?? "스레드 발행 실패");
  return published.id;
}

/** 블로그 글 하나를 스레드에 올리고 기록 (threads_posted_at) */
export async function postBlogToThreads(postId: string, textOverride?: string): Promise<{ ok: true; threadsId: string } | { ok: false; error: string }> {
  const supabase = getSupabaseServiceClient();
  const { data: p, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, threads_text, is_published, threads_posted_at")
    .eq("id", postId)
    .maybeSingle();
  if (error) {
    return { ok: false, error: /threads_posted_at/.test(error.message) ? "DB 항목이 없어요. supabase/migration_threads.sql 을 실행해 주세요." : error.message };
  }
  if (!p) return { ok: false, error: "글을 찾을 수 없어요." };
  if (!p.is_published) return { ok: false, error: "공개된 글만 올릴 수 있어요." };
  const url = `${SITE}/blog/${p.slug}`;
  const text = textOverride?.trim() || (p.threads_text as string | null)?.trim() || `${p.title}\n\n${p.excerpt ?? ""}\n\n${url}`;
  try {
    const threadsId = await publishToThreads(text, url);
    await supabase.from("blog_posts").update({ threads_posted_at: new Date().toISOString(), threads_post_id: threadsId }).eq("id", postId);
    return { ok: true, threadsId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "스레드 게시 실패" };
  }
}

/** 아직 스레드에 안 올린 공개 글 중 가장 최근 것 1개 (하루 1개 자동 게시용) */
export async function nextBlogForThreads(): Promise<string | null> {
  const { data, error } = await getSupabaseServiceClient()
    .from("blog_posts")
    .select("id")
    .eq("is_published", true)
    .is("threads_posted_at", null)
    .order("published_at", { ascending: false })
    .limit(1);
  if (error || !data?.length) return null;
  return data[0].id as string;
}
