// 알림 메일 헬퍼 — 예약/제안/후기 액션마다 자동 발송
//
// 모든 함수는 fire-and-forget. 실패해도 throw 안 함.
// 호출 측에서: void notifyXxx(id);

import { getSupabaseServiceClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import {
  bookingReceivedEmail,
  bookingAcceptedEmail,
  bookingDeclinedEmail,
  bookingCompletedEmail,
  proposalReceivedEmail,
  proposalAcceptedEmail,
  proposalDeclinedEmail,
  reviewReceivedEmail,
  reviewReplyEmail,
  messageReceivedEmail,
} from "@/lib/email-templates";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://pothostravel.com";

const DURATION_LABEL: Record<string, string> = {
  hourly: "시간제",
  half_day: "반나절 (4시간)",
  full_day: "종일 (8시간)",
  multi_day: "다중일",
};

async function fetchUserEmail(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  userId: string
): Promise<{ email: string | null; name: string | null }> {
  const { data } = await supabase
    .schema("next_auth")
    .from("users")
    .select("email, nickname, name")
    .eq("id", userId)
    .maybeSingle();
  return {
    email: data?.email ?? null,
    name: data?.nickname ?? data?.name ?? null,
  };
}

// ========== Booking (Path A) ==========

export async function notifyBookingReceived(bookingId: string): Promise<void> {
  try {
    const supabase = getSupabaseServiceClient();
    const { data: booking } = await supabase
      .from("sherpa_bookings")
      .select(
        "destination_city, start_date, end_date, party_size, duration_type, notes, contact_name, estimated_price_krw, sherpas(display_name, user_id)"
      )
      .eq("id", bookingId)
      .maybeSingle();
    if (!booking) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sherpa = (booking as any).sherpas;
    if (!sherpa?.user_id) return;
    const recipient = await fetchUserEmail(supabase, sherpa.user_id);
    if (!recipient.email) return;

    const tpl = bookingReceivedEmail({
      sherpaName: recipient.name ?? sherpa.display_name,
      travelerName: booking.contact_name,
      destinationCity: booking.destination_city,
      startDate: booking.start_date,
      endDate: booking.end_date,
      partySize: booking.party_size,
      durationLabel:
        DURATION_LABEL[booking.duration_type] ?? booking.duration_type,
      notes: booking.notes,
      estimatedPriceKrw: booking.estimated_price_krw,
    });
    await sendEmail({ to: recipient.email, subject: tpl.subject, html: tpl.html });
  } catch (err) {
    console.error("[notifyBookingReceived] failed:", err);
  }
}

export async function notifyBookingResponse(
  bookingId: string,
  action: "accept" | "decline" | "complete"
): Promise<void> {
  try {
    const supabase = getSupabaseServiceClient();
    const { data: booking } = await supabase
      .from("sherpa_bookings")
      .select(
        "client_id, contact_email, contact_name, destination_city, start_date, end_date, party_size, duration_type, sherpa_message, declined_reason, estimated_price_krw, sherpas(display_name)"
      )
      .eq("id", bookingId)
      .maybeSingle();
    if (!booking) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sherpa = (booking as any).sherpas;
    const sherpaName = sherpa?.display_name ?? "셰르파";
    const travelerName = booking.contact_name ?? "여행자";

    let to: string | null = booking.contact_email ?? null;
    if (!to && booking.client_id) {
      const r = await fetchUserEmail(supabase, booking.client_id);
      to = r.email;
    }
    if (!to) return;

    let tpl: { subject: string; html: string } | null = null;
    if (action === "accept") {
      tpl = bookingAcceptedEmail({
        sherpaName,
        travelerName,
        message: booking.sherpa_message,
        destinationCity: booking.destination_city,
        startDate: booking.start_date,
        endDate: booking.end_date,
        partySize: booking.party_size,
        durationLabel:
          DURATION_LABEL[booking.duration_type] ?? booking.duration_type,
        estimatedPriceKrw: booking.estimated_price_krw,
      });
    } else if (action === "decline") {
      tpl = bookingDeclinedEmail({
        sherpaName,
        travelerName,
        reason: booking.declined_reason,
      });
    } else if (action === "complete") {
      tpl = bookingCompletedEmail({ sherpaName, travelerName });
    }
    if (!tpl) return;
    await sendEmail({ to, subject: tpl.subject, html: tpl.html });
  } catch (err) {
    console.error("[notifyBookingResponse] failed:", err);
  }
}

// ========== Proposal (Path B) ==========

export async function notifyProposalReceived(
  proposalId: string
): Promise<void> {
  try {
    const supabase = getSupabaseServiceClient();
    const { data: proposal } = await supabase
      .from("sherpa_proposals")
      .select(
        "trip_id, proposed_price_krw, proposed_scope, message, sherpas(display_name), travel_plans(title, user_id)"
      )
      .eq("id", proposalId)
      .maybeSingle();
    if (!proposal) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sherpa = (proposal as any).sherpas;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trip = (proposal as any).travel_plans;
    if (!trip?.user_id) return;

    const recipient = await fetchUserEmail(supabase, trip.user_id);
    if (!recipient.email) return;

    const tpl = proposalReceivedEmail({
      travelerName: recipient.name ?? "여행자",
      sherpaName: sherpa?.display_name ?? "셰르파",
      tripTitle: trip.title,
      proposedPriceKrw: proposal.proposed_price_krw,
      proposedScope: proposal.proposed_scope,
      message: proposal.message,
      tripId: proposal.trip_id,
    });
    await sendEmail({ to: recipient.email, subject: tpl.subject, html: tpl.html });
  } catch (err) {
    console.error("[notifyProposalReceived] failed:", err);
  }
}

export async function notifyProposalResponse(
  proposalId: string,
  action: "accept" | "decline",
  reason?: string | null
): Promise<void> {
  try {
    const supabase = getSupabaseServiceClient();
    const { data: proposal } = await supabase
      .from("sherpa_proposals")
      .select(
        "sherpas(display_name, user_id), travel_plans(title, user_id)"
      )
      .eq("id", proposalId)
      .maybeSingle();
    if (!proposal) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sherpa = (proposal as any).sherpas;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trip = (proposal as any).travel_plans;
    if (!sherpa?.user_id) return;

    const recipient = await fetchUserEmail(supabase, sherpa.user_id);
    if (!recipient.email) return;

    let tpl: { subject: string; html: string } | null = null;
    if (action === "accept") {
      // 여행자 닉네임 가져오기
      let travelerName = "여행자";
      if (trip?.user_id) {
        const t = await fetchUserEmail(supabase, trip.user_id);
        travelerName = t.name ?? travelerName;
      }
      tpl = proposalAcceptedEmail({
        sherpaName: recipient.name ?? sherpa.display_name,
        tripTitle: trip?.title ?? "여행",
        travelerName,
      });
    } else if (action === "decline") {
      tpl = proposalDeclinedEmail({
        sherpaName: recipient.name ?? sherpa.display_name,
        tripTitle: trip?.title ?? "여행",
        reason,
      });
    }
    if (!tpl) return;
    await sendEmail({ to: recipient.email, subject: tpl.subject, html: tpl.html });
  } catch (err) {
    console.error("[notifyProposalResponse] failed:", err);
  }
}

// ========== Reviews ==========

export async function notifyReviewReceived(reviewId: string): Promise<void> {
  try {
    const supabase = getSupabaseServiceClient();
    const { data: review } = await supabase
      .from("sherpa_reviews")
      .select(
        "rating, comment, client_id, sherpas(display_name, slug, user_id)"
      )
      .eq("id", reviewId)
      .maybeSingle();
    if (!review) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sherpa = (review as any).sherpas;
    if (!sherpa?.user_id) return;

    const recipient = await fetchUserEmail(supabase, sherpa.user_id);
    if (!recipient.email) return;

    let travelerName = "익명 여행자";
    if (review.client_id) {
      const t = await fetchUserEmail(supabase, review.client_id);
      travelerName = t.name ?? travelerName;
    }

    const tpl = reviewReceivedEmail({
      sherpaName: recipient.name ?? sherpa.display_name,
      travelerName,
      rating: review.rating,
      comment: review.comment,
      sherpaSlug: sherpa.slug,
    });
    await sendEmail({ to: recipient.email, subject: tpl.subject, html: tpl.html });
  } catch (err) {
    console.error("[notifyReviewReceived] failed:", err);
  }
}

export async function notifyReviewReplied(reviewId: string): Promise<void> {
  try {
    const supabase = getSupabaseServiceClient();
    const { data: review } = await supabase
      .from("sherpa_reviews")
      .select(
        "client_id, sherpa_reply, sherpas(display_name, slug)"
      )
      .eq("id", reviewId)
      .maybeSingle();
    if (!review || !review.client_id || !review.sherpa_reply) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sherpa = (review as any).sherpas;
    const recipient = await fetchUserEmail(supabase, review.client_id);
    if (!recipient.email) return;

    const tpl = reviewReplyEmail({
      travelerName: recipient.name ?? "여행자",
      sherpaName: sherpa?.display_name ?? "셰르파",
      reply: review.sherpa_reply,
      sherpaSlug: sherpa?.slug ?? "",
    });
    await sendEmail({ to: recipient.email, subject: tpl.subject, html: tpl.html });
  } catch (err) {
    console.error("[notifyReviewReplied] failed:", err);
  }
}

// ========== Direct Messages ==========

export async function notifyMessageReceived(messageId: string): Promise<void> {
  try {
    const supabase = getSupabaseServiceClient();
    const { data: msg } = await supabase
      .from("sherpa_messages")
      .select("body, sender_id, sender_role, booking_id, proposal_id")
      .eq("id", messageId)
      .maybeSingle();
    if (!msg) return;

    let recipientUserId: string | null = null;
    let threadUrl = "";
    let contextLabel = "Pothos 메시지";
    let senderName = "상대방";

    // 발신자 이름
    const sender = await fetchUserEmail(supabase, msg.sender_id);
    senderName = sender.name ?? senderName;

    if (msg.booking_id) {
      const { data: booking } = await supabase
        .from("sherpa_bookings")
        .select(
          "id, client_id, destination_city, sherpas(user_id, slug, display_name)"
        )
        .eq("id", msg.booking_id)
        .maybeSingle();
      if (!booking) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sherpa = (booking as any).sherpas;
      // 받는 사람: 발신자가 traveler면 sherpa, 아니면 traveler
      if (msg.sender_role === "traveler") {
        recipientUserId = sherpa?.user_id ?? null;
        threadUrl = `${BASE_URL}/sherpa/dashboard`;
      } else {
        recipientUserId = booking.client_id;
        // 여행자에게는 자기 매칭 페이지로 (직접 booking 페이지 없음, 우선 일반 my-trips로)
        threadUrl = `${BASE_URL}/my-trips`;
      }
      contextLabel = `${booking.destination_city} · ${sherpa?.display_name ?? "셰르파"} 예약`;
    } else if (msg.proposal_id) {
      const { data: proposal } = await supabase
        .from("sherpa_proposals")
        .select(
          "id, sherpas(user_id, slug, display_name), travel_plans(user_id, title, id)"
        )
        .eq("id", msg.proposal_id)
        .maybeSingle();
      if (!proposal) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sherpa = (proposal as any).sherpas;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const trip = (proposal as any).travel_plans;
      if (msg.sender_role === "traveler") {
        recipientUserId = sherpa?.user_id ?? null;
        threadUrl = `${BASE_URL}/sherpa/dashboard`;
      } else {
        recipientUserId = trip?.user_id ?? null;
        threadUrl = trip?.id ? `${BASE_URL}/my-trips/${trip.id}` : `${BASE_URL}/my-trips`;
      }
      contextLabel = `${trip?.title ?? "여행"} · ${sherpa?.display_name ?? "셰르파"} 매칭`;
    }

    if (!recipientUserId) return;
    if (recipientUserId === msg.sender_id) return; // 본인에게 발송 X

    const recipient = await fetchUserEmail(supabase, recipientUserId);
    if (!recipient.email) return;

    const tpl = messageReceivedEmail({
      recipientName: recipient.name ?? "사용자",
      senderName,
      preview: msg.body,
      threadUrl,
      contextLabel,
    });
    await sendEmail({ to: recipient.email, subject: tpl.subject, html: tpl.html });
  } catch (err) {
    console.error("[notifyMessageReceived] failed:", err);
  }
}
