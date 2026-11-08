// Meta(스레드)가 보내는 signed_request 검증 — 연결 해제·데이터 삭제 콜백용
import crypto from "node:crypto";

const b64url = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

/** 서명이 맞으면 내용(JSON), 아니면 null */
export function parseSignedRequest(signed: string | null | undefined): { user_id?: string } | null {
  const secret = process.env.THREADS_APP_SECRET;
  if (!signed || !secret || !signed.includes(".")) return null;
  const [sig, payload] = signed.split(".", 2);
  const expected = crypto.createHmac("sha256", secret).update(payload).digest();
  const got = b64url(sig);
  if (got.length !== expected.length || !crypto.timingSafeEqual(got, expected)) return null;
  try {
    return JSON.parse(b64url(payload).toString("utf8"));
  } catch {
    return null;
  }
}

export async function signedFromRequest(req: Request): Promise<string | null> {
  try {
    const form = await req.formData();
    return String(form.get("signed_request") ?? "") || null;
  } catch {
    return null;
  }
}
