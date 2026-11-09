// 스레드 댓글 관리 — 서버 전용
//
// - 최근 14일 동안 올린 내 스레드 글에 달린 댓글을 모아 비공개 버킷 'private-config/threads-replies.json' 에 저장
// - 새 댓글마다 AI(Haiku)가 종류(감사/질문/기타/스팸)를 나누고 답글 초안을 씀
//     · 감사·칭찬 + '감사 답글 자동' 켬 → 바로 짧은 감사 답글
//     · 그 밖 → 관리자 화면에서 확인·수정 후 보내기
//     · 스팸·욕설 → 건너뜀 (목록엔 남김)
// - 새로 확인할 댓글이 생기면 관리자에게 푸시 알림
// - 필요한 권한: threads_read_replies, threads_manage_replies (Meta 앱에 추가 후 다시 연결)

import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServiceClient } from "./supabase";
import { getThreadsConnection, replyOnThreads } from "./threads";
import { getAutoSettings } from "./blog-auto";
import { threadsRules } from "./threads-voice";
import { aiMeter } from "./ai-runs";
import { listAdminIds } from "./admin";
import { sendPushToUser } from "./web-push";

const BUCKET = "private-config";
const PATH = "threads-replies.json";
const GRAPH = "https://graph.threads.net";
const MODEL = "claude-haiku-5-5";

export type ReplyKind = "thanks" | "question" | "other" | "spam";
export type ReplyStatus = "pending" | "sent" | "auto-sent" | "skipped";

export type ThreadsComment = {
  id: string;
  postId: string;
  postText: string;
  postLink: string | null;
  username: string;
  text: string;
  timestamp: string;
  kind: ReplyKind;
  draft: string;
  status: ReplyStatus;
  sentText?: string;
  sentAt?: string;
};

type Store = { lastChecked: string | null; items: Record<string, ThreadsComment> };

async function readStore(): Promise<Store> {
  try {
    const { data, error } = await getSupabaseServiceClient().storage.from(BUCKET).download(PATH);
    if (error || !data) return { lastChecked: null, items: {} };
    const j = JSON.parse(await data.text()) as Store;
    return { lastChecked: j.lastChecked ?? null, items: j.items ?? {} };
  } catch {
    return { lastChecked: null, items: {} };
  }
}

async function writeStore(s: Store) {
  // 오래된 것부터 정리 (최근 500개만)
  const items = Object.values(s.items)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 500);
  const out: Store = { lastChecked: s.lastChecked, items: Object.fromEntries(items.map((i) => [i.id, i])) };
  const supabase = getSupabaseServiceClient();
  const { data: bucket } = await supabase.storage.getBucket(BUCKET);
  if (!bucket) await supabase.storage.createBucket(BUCKET, { public: false });
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(PATH, new Blob([JSON.stringify(out)], { type: "application/json" }), { upsert: true, contentType: "application/json", cacheControl: "0" });
  if (error) throw new Error(error.message);
}

async function graph<T>(path: string, token: string): Promise<T> {
  const r = await fetch(`${GRAPH}/v1.0/${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(token)}`, { cache: "no-store" });
  const j = (await r.json()) as T & { error?: { message?: string } };
  if (!r.ok || j.error) throw new Error(j.error?.message ?? `스레드 API ${r.status}`);
  return j;
}

/** AI: 댓글 종류 나누기 + 답글 초안 */
async function draftReply(postText: string, comment: string, username: string): Promise<{ kind: ReplyKind; draft: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { kind: "other", draft: "" };
  const s = await getAutoSettings();
  const meter = aiMeter(MODEL);
  let ok = false;
  try {
    const voice = threadsRules(s.threadsVoice, s.threadsVoiceCustom).split("\n").find((l) => l.includes("말투:")) ?? "";
    const prompt = `여행 정보 계정 Pothos(@스레드)의 글에 달린 댓글에 답글 초안을 써 주세요.

[우리 글]
${postText.slice(0, 1500)}

[댓글 — @${username}]
${comment.slice(0, 800)}

규칙:
- 먼저 댓글 종류를 고르세요: thanks(감사·칭찬·공감·이모지만), question(질문·정보 요청), other(의견·경험 공유 등), spam(광고·홍보·욕설·무관한 내용)
- 답글은 120자 이내, 1~2문장. ${voice.replace(/^\s*·\s*/, "")}
- 우리 글에 있는 내용 안에서만 답하기. 모르는 건 지어내지 말고 "자세한 건 글에 정리해 뒀어요/최신 정보는 공식 사이트에서 확인해 주세요"처럼 안내
- 직접 다녀온 척 금지, 약속·할인·개인 상담 제안 금지, 해시태그·링크 넣지 않기
- spam 이면 reply 는 빈 문자열

JSON 하나만 출력: {"kind":"thanks|question|other|spam","reply":"답글"}`;
    const msg = await new Anthropic({ apiKey }).messages.create({
      model: MODEL,
      max_tokens: 400,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: prompt }],
    });
    meter.add(msg.usage);
    const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const j = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as { kind?: string; reply?: string };
    const kind: ReplyKind = j.kind === "thanks" || j.kind === "question" || j.kind === "spam" ? j.kind : "other";
    ok = true;
    return { kind, draft: String(j.reply ?? "").trim().slice(0, 300) };
  } catch {
    return { kind: "other", draft: "" };
  } finally {
    await meter.record("threads_reply", null, ok);
  }
}

/** 새 댓글 확인 — 예약 작업·관리자 '새로 확인'에서 호출. 새로 생긴 댓글 수 */
export async function checkThreadsReplies(): Promise<{ added: number; autoSent: number; error?: string }> {
  const conn = await getThreadsConnection();
  if (!conn) return { added: 0, autoSent: 0, error: "not-connected" };
  const settings = await getAutoSettings();
  const store = await readStore();
  let added = 0;
  let autoSent = 0;
  let pendingNew = 0;
  try {
    const since = Date.now() - 14 * 86400000;
    const posts = await graph<{ data?: { id: string; text?: string; timestamp?: string; permalink?: string }[] }>(
      `${conn.userId}/threads?fields=id,text,timestamp,permalink&limit=25`,
      conn.accessToken
    );
    for (const p of posts.data ?? []) {
      if (p.timestamp && new Date(p.timestamp).getTime() < since) continue;
      const replies = await graph<{ data?: { id: string; text?: string; username?: string; timestamp?: string }[] }>(
        `${p.id}/replies?fields=id,text,username,timestamp&limit=50`,
        conn.accessToken
      ).catch(() => ({ data: [] }));
      for (const r of replies.data ?? []) {
        if (!r.text || !r.username || r.username === conn.username || store.items[r.id]) continue;
        const { kind, draft } = await draftReply(p.text ?? "", r.text, r.username);
        const item: ThreadsComment = {
          id: r.id,
          postId: p.id,
          postText: (p.text ?? "").slice(0, 300),
          postLink: p.permalink ?? null,
          username: r.username,
          text: r.text.slice(0, 1000),
          timestamp: r.timestamp ?? new Date().toISOString(),
          kind,
          draft,
          status: kind === "spam" ? "skipped" : "pending",
        };
        // 단순 감사 댓글은 바로 감사 답글
        if (kind === "thanks" && settings.threadsAutoThanks && draft) {
          try {
            await replyOnThreads(r.id, draft);
            item.status = "auto-sent";
            item.sentText = draft;
            item.sentAt = new Date().toISOString();
            autoSent++;
          } catch {
            // 실패하면 확인 목록에 남김
          }
        }
        store.items[r.id] = item;
        added++;
        if (item.status === "pending") pendingNew++;
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await writeStore({ ...store, lastChecked: new Date().toISOString() }).catch(() => {});
    return { added, autoSent, error: /permission|scope|권한/i.test(msg) ? "댓글 권한이 없어요. Meta 앱에 권한을 추가하고 스레드를 다시 연결해 주세요." : msg };
  }
  store.lastChecked = new Date().toISOString();
  await writeStore(store);

  // 확인할 새 댓글이 있으면 관리자에게 알림
  if (pendingNew > 0) {
    const admins = await listAdminIds();
    await Promise.all(
      admins.map((uid) => sendPushToUser(uid, { title: `🧵 스레드 새 댓글 ${pendingNew}개`, body: "답글 초안을 확인하고 보내 주세요.", url: "/admin/threads-replies", tag: "threads-replies" }))
    );
  }
  return { added, autoSent };
}

export async function listThreadsComments(): Promise<{ lastChecked: string | null; items: ThreadsComment[] }> {
  const s = await readStore();
  return { lastChecked: s.lastChecked, items: Object.values(s.items).sort((a, b) => b.timestamp.localeCompare(a.timestamp)) };
}

export async function sendThreadsReply(id: string, text: string) {
  const s = await readStore();
  const item = s.items[id];
  if (!item) throw new Error("댓글을 찾을 수 없어요.");
  const body = text.trim();
  if (!body) throw new Error("답글 내용을 써 주세요.");
  await replyOnThreads(id, body);
  s.items[id] = { ...item, status: "sent", sentText: body, sentAt: new Date().toISOString() };
  await writeStore(s);
}

export async function skipThreadsComment(id: string) {
  const s = await readStore();
  if (s.items[id]) s.items[id] = { ...s.items[id], status: "skipped" };
  await writeStore(s);
}

export async function redraftThreadsComment(id: string): Promise<string> {
  const s = await readStore();
  const item = s.items[id];
  if (!item) throw new Error("댓글을 찾을 수 없어요.");
  const { draft } = await draftReply(item.postText, item.text, item.username);
  s.items[id] = { ...item, draft };
  await writeStore(s);
  return draft;
}
