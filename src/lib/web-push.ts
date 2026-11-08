// 웹 푸시 알림 — 서버 전용
//
// - VAPID 키: Vercel 환경변수 VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY 가 있으면 그걸 쓰고,
//   없으면 처음 한 번 자동으로 만들어 Supabase 비공개 버킷 'private-config/vapid.json' 에 저장
//   (서비스 키로만 읽을 수 있음 — 따로 설정할 것 없음)
// - 구독: push_subscriptions 테이블 (supabase/migration_blog_comments.sql)
// - 만료된 구독(404/410)은 보낼 때 자동 삭제
// - 모든 함수는 실패해도 throw 안 함

import webpush from "web-push";
import { getSupabaseServiceClient } from "./supabase";

const BUCKET = "private-config";
const PATH = "vapid.json";
const SITE = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://pothostravel.com").replace(/\/$/, "");

type Keys = { publicKey: string; privateKey: string };
let cached: Keys | null = null;

async function readStored(): Promise<Keys | null> {
  try {
    const { data, error } = await getSupabaseServiceClient().storage.from(BUCKET).download(PATH);
    if (error || !data) return null;
    const j = JSON.parse(await data.text()) as Keys;
    return j.publicKey && j.privateKey ? j : null;
  } catch {
    return null;
  }
}

export async function vapidKeys(): Promise<Keys | null> {
  if (cached) return cached;
  const envPub = process.env.VAPID_PUBLIC_KEY;
  const envPriv = process.env.VAPID_PRIVATE_KEY;
  if (envPub && envPriv) return (cached = { publicKey: envPub, privateKey: envPriv });
  const stored = await readStored();
  if (stored) return (cached = stored);
  try {
    const supabase = getSupabaseServiceClient();
    const { data: bucket } = await supabase.storage.getBucket(BUCKET);
    if (!bucket) await supabase.storage.createBucket(BUCKET, { public: false });
    const fresh = webpush.generateVAPIDKeys();
    // 동시에 두 번 만들어지는 경우를 막으려고 덮어쓰기 금지 → 실패하면 먼저 저장된 키를 읽음
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(PATH, new Blob([JSON.stringify(fresh)], { type: "application/json" }), { upsert: false, contentType: "application/json" });
    if (error) return (cached = await readStored());
    return (cached = fresh);
  } catch (e) {
    console.error("[web-push] VAPID 키 준비 실패:", e);
    return null;
  }
}

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

/** 한 사용자의 모든 기기로 푸시. 보낸 기기 수를 돌려줌 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  try {
    const keys = await vapidKeys();
    if (!keys) return 0;
    const supabase = getSupabaseServiceClient();
    const { data: subs } = await supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", userId);
    if (!subs?.length) return 0;
    const body = JSON.stringify({ ...payload, url: payload.url ?? "/" });
    let sent = 0;
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, {
            vapidDetails: { subject: SITE, publicKey: keys.publicKey, privateKey: keys.privateKey },
            TTL: 60 * 60 * 24,
            urgency: "normal",
          });
          sent++;
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) await supabase.from("push_subscriptions").delete().eq("id", s.id);
          else console.error("[web-push] 보내기 실패:", code, e instanceof Error ? e.message : e);
        }
      })
    );
    return sent;
  } catch (e) {
    console.error("[web-push] sendPushToUser 실패:", e);
    return 0;
  }
}

export async function pushSubscriptionCount(userId: string): Promise<number> {
  try {
    const { count } = await getSupabaseServiceClient()
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    return count ?? 0;
  } catch {
    return 0;
  }
}
