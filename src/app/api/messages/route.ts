// 메시지 스레드 API
//
// POST /api/messages
//   { bookingId? | proposalId?, body }
//   -> 201 { id }
//
// GET /api/messages?bookingId=... or ?proposalId=...
//   -> { messages: [{ id, sender_id, sender_role, body, created_at, read_at }] }
//
// 자격: 해당 스레드의 traveler 또는 sherpa 본인만

import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { notifyMessageReceived } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ThreadContext {
  threadType: "booking" | "proposal";
  threadId: string;
  travelerId: string | null;
  sherpaUserId: string | null;
}

async function resolveThread(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  bookingId: string | null,
  proposalId: string | null
): Promise<ThreadContext | null> {
  if (bookingId) {
    const { data } = await supabase
      .from("sherpa_bookings")
      .select("id, client_id, sherpas(user_id)")
      .eq("id", bookingId)
      .maybeSingle();
    if (!data) return null;
    return {
      threadType: "booking",
      threadId: bookingId,
      travelerId: data.client_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sherpaUserId: (data as any).sherpas?.user_id ?? null,
    };
  }
  if (proposalId) {
    const { data } = await supabase
      .from("sherpa_proposals")
      .select("id, sherpas(user_id), travel_plans(user_id)")
      .eq("id", proposalId)
      .maybeSingle();
    if (!data) return null;
    return {
      threadType: "proposal",
      threadId: proposalId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      travelerId: (data as any).travel_plans?.user_id ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sherpaUserId: (data as any).sherpas?.user_id ?? null,
    };
  }
  return null;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  let body: { bookingId?: string; proposalId?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const text = body.body?.trim() ?? "";
  if (text.length < 1 || text.length > 4000) {
    return Response.json(
      { error: "메시지는 1~4000자여야 합니다." },
      { status: 400 }
    );
  }
  if (!body.bookingId && !body.proposalId) {
    return Response.json({ error: "스레드 키 누락" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const ctx = await resolveThread(
    supabase,
    body.bookingId ?? null,
    body.proposalId ?? null
  );
  if (!ctx) {
    return Response.json({ error: "스레드를 찾을 수 없어요." }, { status: 404 });
  }

  const isTraveler = ctx.travelerId === session.user.id;
  const isSherpa = ctx.sherpaUserId === session.user.id;
  if (!isTraveler && !isSherpa) {
    return Response.json(
      { error: "이 스레드에 메시지를 보낼 수 없어요." },
      { status: 403 }
    );
  }

  const { data: inserted, error } = await supabase
    .from("sherpa_messages")
    .insert({
      booking_id: body.bookingId ?? null,
      proposal_id: body.proposalId ?? null,
      sender_id: session.user.id,
      sender_role: isTraveler ? "traveler" : "sherpa",
      body: text,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return Response.json({ error: "전송 중 오류" }, { status: 500 });
  }

  // 상대방에게 알림
  void notifyMessageReceived(inserted.id);

  return Response.json({ id: inserted.id }, { status: 201 });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const url = new URL(request.url);
  const bookingId = url.searchParams.get("bookingId");
  const proposalId = url.searchParams.get("proposalId");
  if (!bookingId && !proposalId) {
    return Response.json({ error: "스레드 키 누락" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const ctx = await resolveThread(supabase, bookingId, proposalId);
  if (!ctx) {
    return Response.json({ error: "스레드를 찾을 수 없어요." }, { status: 404 });
  }

  const isTraveler = ctx.travelerId === session.user.id;
  const isSherpa = ctx.sherpaUserId === session.user.id;
  if (!isTraveler && !isSherpa) {
    return Response.json(
      { error: "이 스레드를 볼 수 없어요." },
      { status: 403 }
    );
  }

  let q = supabase
    .from("sherpa_messages")
    .select("id, sender_id, sender_role, body, created_at, read_at")
    .order("created_at", { ascending: true })
    .limit(200);
  if (bookingId) q = q.eq("booking_id", bookingId);
  else if (proposalId) q = q.eq("proposal_id", proposalId);

  const { data: messages } = await q;

  // 본인이 받은 메시지를 읽음 처리
  const unreadIds = (messages ?? [])
    .filter(
      (m) =>
        !m.read_at &&
        ((isTraveler && m.sender_role === "sherpa") ||
          (isSherpa && m.sender_role === "traveler"))
    )
    .map((m) => m.id);
  if (unreadIds.length > 0) {
    await supabase
      .from("sherpa_messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);
  }

  return Response.json({ messages: messages ?? [] });
}
