import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";

export type UserRole = "user" | "business" | "admin";

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "일반",
  business: "기업회원",
  admin: "관리자",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  user: "bg-gray-100 text-gray-700",
  business: "bg-emerald-100 text-emerald-700",
  admin: "bg-purple-100 text-purple-700",
};

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}

export async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .schema("next_auth")
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  const role = (data?.role as UserRole | undefined) ?? null;
  if (role === "admin" || role === "business" || role === "user") return role;

  // role 컬럼이 없는 경우 fallback: 기존 admins 테이블 확인
  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return adminRow ? "admin" : "user";
}

export async function isAdmin(userId: string): Promise<boolean> {
  return (await getUserRole(userId)) === "admin";
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const admin = await isAdmin(session.user.id);
  if (!admin) return null;
  return session;
}
