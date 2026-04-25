import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const admin = await isAdmin(session.user.id);
  if (!admin) return null;
  return session;
}
