import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  const session = await auth();
  let user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null = null;

  if (session?.user?.id) {
    try {
      const supabase = getSupabaseServiceClient();
      const { data } = await supabase
        .schema("next_auth")
        .from("users")
        .select("name, email, image, custom_image")
        .eq("id", session.user.id)
        .single();
      user = {
        name: data?.name ?? session.user.name ?? null,
        email: data?.email ?? session.user.email ?? null,
        image: data?.custom_image ?? data?.image ?? session.user.image ?? null,
      };
    } catch {
      user = {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      };
    }
  }

  return <HeaderClient user={user} />;
}
