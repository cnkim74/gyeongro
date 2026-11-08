// 웹 푸시 구독 관리
// GET    -> { publicKey, enabled }           (enabled: 로그인 사용자의 구독 기기 수 > 0)
// POST   { subscription }                    -> 이 기기 구독 저장
// POST   { action: "test" }                  -> 내 기기들로 시험 알림
// DELETE { endpoint }                        -> 이 기기 구독 해제
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { vapidKeys, sendPushToUser, pushSubscriptionCount } from "@/lib/web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const keys = await vapidKeys();
  const session = await auth();
  const count = session?.user?.id ? await pushSubscriptionCount(session.user.id) : 0;
  return Response.json({ publicKey: keys?.publicKey ?? null, enabled: count > 0 });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  };

  if (body.action === "test") {
    const sent = await sendPushToUser(session.user.id, {
      title: "Pothos 알림이 켜졌어요 🔔",
      body: "새 댓글·답글이 달리면 이렇게 알려 드릴게요.",
      url: "/blog",
      tag: "push-test",
    });
    return Response.json({ sent });
  }

  const s = body.subscription;
  const endpoint = String(s?.endpoint ?? "");
  const p256dh = String(s?.keys?.p256dh ?? "");
  const authKey = String(s?.keys?.auth ?? "");
  if (!/^https:\/\//.test(endpoint) || !p256dh || !authKey) {
    return Response.json({ error: "구독 정보가 올바르지 않아요." }, { status: 400 });
  }
  const { error } = await getSupabaseServiceClient()
    .from("push_subscriptions")
    .upsert(
      {
        user_id: session.user.id,
        endpoint: endpoint.slice(0, 1000),
        p256dh: p256dh.slice(0, 200),
        auth: authKey.slice(0, 100),
        user_agent: (req.headers.get("user-agent") ?? "").slice(0, 300),
      },
      { onConflict: "endpoint" }
    );
  if (error) {
    const missing = /push_subscriptions/.test(error.message);
    return Response.json(
      { error: missing ? "알림 테이블이 아직 없어요. supabase/migration_blog_comments.sql 을 실행해 주세요." : error.message },
      { status: 500 }
    );
  }
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (body.endpoint) {
    await getSupabaseServiceClient().from("push_subscriptions").delete().eq("endpoint", body.endpoint).eq("user_id", session.user.id);
  }
  return Response.json({ ok: true });
}
