// 이메일/비밀번호 회원가입 API
//
// POST { email, password, nickname?, phone?, avatarPreset? }
//   -> 201 { id, email }
//   -> 400 (검증 실패), 409 (중복), 500 (서버)
//
// 닉네임은 권장(선택). 미입력 시 NULL로 저장.

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { AVATAR_BY_ID } from "@/lib/avatars";

export const runtime = "nodejs";

const NICKNAME_RE = /^[A-Za-z0-9가-힣]{2,12}$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]{8,}$/;
const PHONE_RE = /^01[016789]-?\d{3,4}-?\d{4}$/;

function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  return input;
}

export async function POST(request: Request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return Response.json({ error: "서버 설정 오류" }, { status: 500 });
  }

  let body: {
    email?: string;
    password?: string;
    nickname?: string;
    phone?: string;
    avatarPreset?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const nickname = body.nickname?.trim() || null;
  const phoneInput = body.phone?.trim() || null;
  const avatarPreset = body.avatarPreset?.trim() || null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "올바른 이메일 주소를 입력해주세요." }, { status: 400 });
  }
  if (!PASSWORD_RE.test(password)) {
    return Response.json(
      { error: "비밀번호는 영문과 숫자를 포함한 8자 이상이어야 합니다." },
      { status: 400 }
    );
  }
  if (nickname && !NICKNAME_RE.test(nickname)) {
    return Response.json(
      { error: "닉네임은 한글/영문/숫자 2~12자여야 합니다." },
      { status: 400 }
    );
  }

  let phone: string | null = null;
  if (phoneInput) {
    const normalized = normalizePhone(phoneInput);
    if (!PHONE_RE.test(normalized)) {
      return Response.json(
        { error: "올바른 휴대폰 번호 형식이 아닙니다. (예: 010-1234-5678)" },
        { status: 400 }
      );
    }
    phone = normalized;
  }

  if (avatarPreset && !AVATAR_BY_ID[avatarPreset]) {
    return Response.json({ error: "잘못된 아바타 선택입니다." }, { status: 400 });
  }

  const sb = createClient(url, key, {
    db: { schema: "next_auth" },
    auth: { persistSession: false },
  });

  // 이메일 중복 체크
  const { data: existingByEmail } = await sb
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existingByEmail) {
    return Response.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
  }

  // 닉네임 중복 체크 (대소문자 무시)
  if (nickname) {
    const { data: existingByNickname } = await sb
      .from("users")
      .select("id")
      .ilike("nickname", nickname)
      .maybeSingle();
    if (existingByNickname) {
      return Response.json({ error: "이미 사용 중인 닉네임입니다." }, { status: 409 });
    }
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { data: inserted, error } = await sb
    .from("users")
    .insert({
      email,
      name: nickname,
      nickname,
      phone,
      avatar_preset: avatarPreset,
      password_hash,
      signup_provider: "credentials",
    })
    .select("id, email")
    .single();

  if (error || !inserted) {
    if (error?.code === "23505") {
      return Response.json({ error: "이미 사용 중인 이메일 또는 닉네임입니다." }, { status: 409 });
    }
    return Response.json({ error: "가입 중 오류가 발생했습니다." }, { status: 500 });
  }

  return Response.json({ id: inserted.id, email: inserted.email }, { status: 201 });
}
