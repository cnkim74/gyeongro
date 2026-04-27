// 이메일 발송 — Resend 기반
//
// 환경변수:
//   RESEND_API_KEY: Resend API 키 (https://resend.com/api-keys)
//   EMAIL_FROM:     발신 이메일 (기본: 'Pothos <noreply@pothostravel.com>')
//                   도메인 검증 전이라면 'Pothos <onboarding@resend.dev>' 사용 가능
//
// 사용법:
//   await sendEmail({ to, subject, html });
//
// 실패해도 throw 안 함 — 호출하는 비즈니스 로직(승인 등)이 막히지 않도록

import { Resend } from "resend";

interface SendInput {
  to: string;
  subject: string;
  html: string;
}

interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail({ to, subject, html }: SendInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set; skipping send to", to);
    return { ok: false, error: "no_api_key" };
  }
  const from = process.env.EMAIL_FROM ?? "Pothos <onboarding@resend.dev>";

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({ from, to, subject, html });
    if (result.error) {
      console.error("[email] resend error:", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id };
  } catch (err) {
    console.error("[email] send failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}
