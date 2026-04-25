import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "");
  if (digits.length < 10 || digits.length > 11) return null;
  if (!digits.startsWith("01")) return null;
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const body = await req.json();
  const phone = normalizePhone(body.phone ?? "");
  if (!phone) {
    return Response.json(
      { error: "올바른 휴대전화 번호를 입력해주세요. (예: 010-1234-5678)" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .schema("next_auth")
    .from("users")
    .update({ phone })
    .eq("id", session.user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ phone });
}
