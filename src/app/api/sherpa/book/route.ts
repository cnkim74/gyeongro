// 셰르파 직접 예약 요청 API (Path A)
//
// POST { sherpaId, destinationCity, startDate, endDate, durationType,
//        durationHours?, partySize, notes, contactName, contactEmail,
//        contactPhone?, estimatedPriceKrw? }
//   -> 201 { id }
//
// 셰르파에게 직접 예약 요청을 보냅니다. 셰르파가 수락/거절 가능.

import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { notifyBookingReceived } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_DURATION = new Set(["hourly", "half_day", "full_day", "multi_day"]);

export async function POST(request: Request) {
  let body: {
    sherpaId?: string;
    destinationCity?: string;
    startDate?: string;
    endDate?: string;
    durationType?: string;
    durationHours?: number | null;
    partySize?: number;
    notes?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string | null;
    estimatedPriceKrw?: number | null;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  if (!body.sherpaId) {
    return Response.json({ error: "잘못된 셰르파입니다." }, { status: 400 });
  }
  if (!body.destinationCity?.trim() || !body.startDate || !body.endDate) {
    return Response.json({ error: "도시와 기간을 입력해주세요." }, { status: 400 });
  }
  if (!body.durationType || !VALID_DURATION.has(body.durationType)) {
    return Response.json({ error: "이용 시간을 선택해주세요." }, { status: 400 });
  }
  const contactName = body.contactName?.trim() ?? "";
  const contactEmail = body.contactEmail?.trim().toLowerCase() ?? "";
  const notes = body.notes?.trim() ?? "";
  if (!contactName || !EMAIL_RE.test(contactEmail) || notes.length < 6) {
    return Response.json(
      { error: "이름·이메일·요청사항을 정확히 입력해주세요." },
      { status: 400 }
    );
  }

  const partySize = Math.max(1, Math.min(20, body.partySize ?? 1));

  const session = await auth();
  const supabase = getSupabaseServiceClient();

  // 셰르파 존재 검증
  const { data: sherpa } = await supabase
    .from("sherpas")
    .select("id, status")
    .eq("id", body.sherpaId)
    .maybeSingle();
  if (!sherpa || sherpa.status !== "published") {
    return Response.json({ error: "잘못된 셰르파입니다." }, { status: 400 });
  }

  const { data: inserted, error } = await supabase
    .from("sherpa_bookings")
    .insert({
      sherpa_id: body.sherpaId,
      client_id: session?.user?.id ?? null,
      destination_city: body.destinationCity.trim(),
      start_date: body.startDate,
      end_date: body.endDate,
      duration_type: body.durationType,
      duration_hours: body.durationType === "hourly" ? body.durationHours : null,
      party_size: partySize,
      notes,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: body.contactPhone || null,
      estimated_price_krw: body.estimatedPriceKrw ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return Response.json(
      { error: "예약 요청 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  // 셰르파에게 알림 메일
  void notifyBookingReceived(inserted.id);

  return Response.json({ id: inserted.id }, { status: 201 });
}
