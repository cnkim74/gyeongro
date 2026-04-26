import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import HeaderClient from "./HeaderClient";
import type { UserRole } from "@/lib/admin";

export default async function Header() {
  const session = await auth();
  let user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: UserRole;
    businessName?: string | null;
  } | null = null;

  if (session?.user?.id) {
    const supabase = getSupabaseServiceClient();

    type UserRow = {
      name: string | null;
      email: string | null;
      image: string | null;
      custom_image: string | null;
      role: string | null;
      business_name?: string | null;
    };

    let data: UserRow | null = null;
    try {
      const result = await supabase
        .schema("next_auth")
        .from("users")
        .select("name, email, image, custom_image, role, business_name")
        .eq("id", session.user.id)
        .maybeSingle();
      data = result.data as UserRow | null;
      if (!data && result.error) throw result.error;
    } catch {
      const fallback = await supabase
        .schema("next_auth")
        .from("users")
        .select("name, email, image, custom_image, role")
        .eq("id", session.user.id)
        .maybeSingle();
      data = (fallback.data as UserRow | null) ?? null;
    }

    const role: UserRole =
      data?.role === "admin" || data?.role === "business" || data?.role === "user"
        ? (data.role as UserRole)
        : "user";

    user = {
      name: data?.name ?? session.user.name ?? null,
      email: data?.email ?? session.user.email ?? null,
      image: data?.custom_image ?? data?.image ?? session.user.image ?? null,
      role,
      businessName: data?.business_name ?? null,
    };
  }

  return <HeaderClient user={user} />;
}
