import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";

export async function getCurrentUserPhone(userId: string): Promise<string | null> {
  try {
    const supabase = getSupabaseServiceClient();
    const { data } = await supabase
      .schema("next_auth")
      .from("users")
      .select("phone")
      .eq("id", userId)
      .maybeSingle();
    return (data?.phone as string | null) ?? null;
  } catch {
    return null;
  }
}

export async function ensurePhoneOrRedirect(callbackUrl: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const phone = await getCurrentUserPhone(session.user.id);
  if (!phone) {
    return `/onboarding?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  }
  return null;
}
