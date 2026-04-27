import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import HeaderClient from "./HeaderClient";
import type { UserRole } from "@/lib/admin";
import { getLocale, createTranslator } from "@/lib/i18n";
import type { MessageKey } from "@/messages";

export default async function Header() {
  const locale = await getLocale();
  const t = createTranslator(locale);
  const labels: Record<MessageKey, string> = {} as Record<MessageKey, string>;
  // Header에서 쓰는 키만 미리 계산해서 클라이언트에 전달
  const headerKeys: MessageKey[] = [
    "nav.planner",
    "nav.themes",
    "nav.sherpa",
    "nav.medical",
    "nav.partners",
    "nav.stories",
    "nav.community",
    "nav.login",
    "nav.signup",
    "nav.cta",
    "nav.profile",
    "nav.my_trips",
    "nav.logout",
    "nav.language",
  ];
  for (const k of headerKeys) labels[k] = t(k);

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

  return <HeaderClient user={user} locale={locale} labels={labels} />;
}
