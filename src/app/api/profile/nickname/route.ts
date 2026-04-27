// 닉네임 설정/변경 API
//
// POST { nickname: string | null }
//   -> 200 { nickname }   (null로 보내면 닉네임 제거)
//   -> 400 (형식 오류), 409 (중복), 401, 500

import { auth } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NICKNAME_RE = /^[A-Za-z0-9가-힣]{2,12}$/;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return Response.json({ error: "서버 설정 오류" }, { status: 500 });
  }

  let body: { nickname?: string | null };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const raw = body.nickname?.trim();
  const nickname = raw && raw.length > 0 ? raw : null;

  if (nickname !== null && !NICKNAME_RE.test(nickname)) {
    return Response.json(
      { error: "닉네임은 한글/영문/숫자 2~12자여야 합니다." },
      { status: 400 }
    );
  }

  const sb = createClient(url, key, {
    db: { schema: "next_auth" },
    auth: { persistSession: false },
  });

  if (nickname) {
    const { data: existing } = await sb
      .from("users")
      .select("id")
      .ilike("nickname", nickname)
      .neq("id", session.user.id)
      .maybeSingle();
    if (existing) {
      return Response.json({ error: "이미 사용 중인 닉네임입니다." }, { status: 409 });
    }
  }

  const { error } = await sb
    .from("users")
    .update({ nickname })
    .eq("id", session.user.id);

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "이미 사용 중인 닉네임입니다." }, { status: 409 });
    }
    return Response.json({ error: "저장 중 오류가 발생했습니다." }, { status: 500 });
  }

  return Response.json({ nickname });
}
