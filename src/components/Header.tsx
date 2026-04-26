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
    try {
      const supabase = getSupabaseServiceClient();
      const { data } = await supabase
        .schema("next_auth")
        .from("users")
        .select("name, email, image, custom_image, role, business_name")
        .eq("id", session.user.id)
        .single();

      const role: UserRole =
        data?.role === "admin" || data?.role === "business" || data?.role === "user"
          ? data.role
          : "user";

      user = {
        name: data?.name ?? session.user.name ?? null,
        email: data?.email ?? session.user.email ?? null,
        image: data?.custom_image ?? data?.image ?? session.user.image ?? null,
        role,
        businessName: data?.business_name ?? null,
      };
    } catch {
      user = {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
        role: "user",
        businessName: null,
      };
    }
  }

  return <HeaderClient user={user} />;
}
