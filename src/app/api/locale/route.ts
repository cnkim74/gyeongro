// 언어 설정 토글 — 쿠키에 locale 저장
//
// POST { locale: "ko" | "en" }

import { cookies } from "next/headers";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const locale = body?.locale;
  if (!isLocale(locale)) {
    return Response.json({ error: "invalid locale" }, { status: 400 });
  }
  const c = await cookies();
  c.set({
    name: LOCALE_COOKIE,
    value: locale,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return Response.json({ locale });
}
