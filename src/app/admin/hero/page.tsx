import { requireAdmin } from "@/lib/admin";
import { getHeroConfigFresh } from "@/lib/hero-server";
import HeroEditor from "./HeroEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "메인 히어로 관리 - Pothos",
};

export default async function AdminHeroPage() {
  await requireAdmin();
  const config = await getHeroConfigFresh();
  return <HeroEditor initial={config} />;
}
