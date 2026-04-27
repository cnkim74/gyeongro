// 의료관광 상담 문의 접수
//
// POST { clinicId?, procedureSlug?, contactName, contactEmail, contactPhone?,
//        preferredContact, preferredDate?, budgetKrw?, notes }
//   -> 201 { id }

import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: {
    clinicId?: string;
    procedureSlug?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string | null;
    preferredContact?: "email" | "phone" | "kakao" | "whatsapp";
    preferredDate?: string | null;
    budgetKrw?: number | null;
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const contactName = body.contactName?.trim() ?? "";
  const contactEmail = body.contactEmail?.trim().toLowerCase() ?? "";
  const notes = body.notes?.trim() ?? "";

  if (!contactName) {
    return Response.json({ error: "이름을 입력해주세요." }, { status: 400 });
  }
  if (!EMAIL_RE.test(contactEmail)) {
    return Response.json({ error: "올바른 이메일 주소를 입력해주세요." }, { status: 400 });
  }
  if (notes.length < 6) {
    return Response.json(
      { error: "상담 내용을 6자 이상 입력해주세요." },
      { status: 400 }
    );
  }

  const session = await auth();
  const supabase = getSupabaseServiceClient();

  // 클리닉 존재 검증 (있을 경우)
  if (body.clinicId) {
    const { data: clinic } = await supabase
      .from("medical_clinics")
      .select("id, status")
      .eq("id", body.clinicId)
      .maybeSingle();
    if (!clinic || clinic.status !== "published") {
      return Response.json({ error: "잘못된 클리닉입니다." }, { status: 400 });
    }
  }

  const { data: inserted, error } = await supabase
    .from("medical_inquiries")
    .insert({
      clinic_id: body.clinicId ?? null,
      procedure_slug: body.procedureSlug ?? null,
      user_id: session?.user?.id ?? null,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: body.contactPhone || null,
      preferred_contact: body.preferredContact ?? "email",
      preferred_date: body.preferredDate || null,
      budget_krw: body.budgetKrw ?? null,
      notes,
      status: "new",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return Response.json({ error: "접수 중 오류가 발생했습니다." }, { status: 500 });
  }

  // inquiry_count 증가 (best-effort)
  if (body.clinicId) {
    const { data: c } = await supabase
      .from("medical_clinics")
      .select("inquiry_count")
      .eq("id", body.clinicId)
      .maybeSingle();
    if (c) {
      await supabase
        .from("medical_clinics")
        .update({ inquiry_count: (c.inquiry_count ?? 0) + 1 })
        .eq("id", body.clinicId);
    }
  }

  return Response.json({ id: inserted.id }, { status: 201 });
}
