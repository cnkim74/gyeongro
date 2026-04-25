import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

const VALID_ROLES = ["user", "business", "admin"] as const;
type Role = (typeof VALID_ROLES)[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "권한 없음" }, { status: 403 });

  const { id } = await params;
  if (id === session.user.id) {
    return Response.json(
      { error: "본인의 권한은 변경할 수 없어요." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const role = body.role as Role | undefined;
  const legacyIsAdmin = body.isAdmin as boolean | undefined;

  let targetRole: Role | undefined;
  if (role && VALID_ROLES.includes(role)) {
    targetRole = role;
  } else if (typeof legacyIsAdmin === "boolean") {
    targetRole = legacyIsAdmin ? "admin" : "user";
  }

  if (!targetRole) {
    return Response.json({ error: "유효하지 않은 role" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  // 1) role 컬럼 업데이트 (있으면)
  const { error: updateError } = await supabase
    .schema("next_auth")
    .from("users")
    .update({ role: targetRole })
    .eq("id", id);

  if (updateError && !/role/i.test(updateError.message)) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  // 2) admins 테이블 동기화 (role='admin'이면 추가, 아니면 제거)
  if (targetRole === "admin") {
    await supabase.from("admins").upsert({ user_id: id });
  } else {
    await supabase.from("admins").delete().eq("user_id", id);
  }

  return Response.json({ ok: true, role: targetRole });
}
