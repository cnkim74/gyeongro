// 닉네임/이메일 중복 체크 API
//
// GET /api/auth/check?field=nickname&value=홍길동
//   -> { available: true | false, reason?: string }
//
// 회원가입 폼의 실시간(debounced) 검증용.

import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const NICKNAME_RE = /^[A-Za-z0-9가-힣]{2,12}$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const field = url.searchParams.get("field");
  const value = (url.searchParams.get("value") ?? "").trim();

  if (!field || !value) {
    return Response.json({ available: false, reason: "value 누락" }, { status: 400 });
  }

  if (field !== "nickname" && field !== "email") {
    return Response.json({ available: false, reason: "지원하지 않는 필드" }, { status: 400 });
  }

  if (field === "nickname" && !NICKNAME_RE.test(value)) {
    return Response.json({
      available: false,
      reason: "닉네임은 한글/영문/숫자 2~12자",
    });
  }
  if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return Response.json({ available: false, reason: "이메일 형식 오류" });
  }

  const sbUrl = process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !sbKey) {
    return Response.json({ available: false, reason: "서버 설정 오류" }, { status: 500 });
  }

  const sb = createClient(sbUrl, sbKey, {
    db: { schema: "next_auth" },
    auth: { persistSession: false },
  });

  const query = sb.from("users").select("id");
  const { data } =
    field === "nickname"
      ? await query.ilike("nickname", value).maybeSingle()
      : await query.eq("email", value.toLowerCase()).maybeSingle();

  return Response.json({ available: !data });
}
