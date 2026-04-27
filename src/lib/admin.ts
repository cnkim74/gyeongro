import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";

// 4역할 체계 (internal 식별자는 기존 호환성을 위해 유지)
//   user     → "여행자"   (일반 회원)
//   business → "파트너"   (기업·클리닉·여행사 등)
//   sherpa   → "셰르파"   (현지 가이드)
//   admin    → "운영팀"   (관리자)
export type UserRole = "user" | "business" | "sherpa" | "admin";

export const VALID_ROLES: UserRole[] = ["user", "business", "sherpa", "admin"];

// 신뢰할 수 없는 입력(예: DB에서 받은 role 컬럼)을 안전한 UserRole로 정규화
export function parseRole(input: unknown): UserRole {
  if (typeof input === "string" && (VALID_ROLES as string[]).includes(input)) {
    return input as UserRole;
  }
  return "user";
}

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "여행자",
  business: "파트너",
  sherpa: "셰르파",
  admin: "운영팀",
};

export const ROLE_LABELS_FORMAL: Record<UserRole, string> = {
  user: "일반회원",
  business: "기업회원",
  sherpa: "셰르파",
  admin: "관리자",
};

export const ROLE_EMOJIS: Record<UserRole, string> = {
  user: "🧳",
  business: "🏢",
  sherpa: "🏔️",
  admin: "🛡️",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  user: "bg-blue-100 text-blue-700",
  business: "bg-emerald-100 text-emerald-700",
  sherpa: "bg-amber-100 text-amber-700",
  admin: "bg-purple-100 text-purple-700",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  user: "여행을 계획하고 셰르파를 만나요",
  business: "클리닉·여행사·항공·렌탈 등 파트너로 합류",
  sherpa: "현지 가이드로 활동하며 여행자를 안내",
  admin: "플랫폼 운영",
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

  const role = data?.role as UserRole | undefined;
  if (role && VALID_ROLES.includes(role)) return role;

  // fallback: role 컬럼 없거나 잘못된 값 → admins 테이블 확인 후 user
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

export async function isSherpa(userId: string): Promise<boolean> {
  return (await getUserRole(userId)) === "sherpa";
}

export async function isPartner(userId: string): Promise<boolean> {
  return (await getUserRole(userId)) === "business";
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const admin = await isAdmin(session.user.id);
  if (!admin) return null;
  return session;
}
